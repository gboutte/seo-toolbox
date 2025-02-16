import { DOCUMENT, isPlatformServer } from '@angular/common';
import {
  Inject,
  Injectable,
  Optional,
  PLATFORM_ID,
  REQUEST,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BASE_URL_DOMAIN } from './domain.token';

@Injectable({
  providedIn: 'root',
})
export class SeoTagsService {
  private metaService: Meta;
  private titleService: Title;
  private domain: string;

  constructor(
    metaService: Meta,
    titleService: Title,
    @Inject(DOCUMENT) private document: any,
    @Inject(PLATFORM_ID) private platformId: any,
    @Optional() @Inject(REQUEST) request: Request | null,
    @Optional() @Inject(BASE_URL_DOMAIN) private base_url: string,
  ) {
    this.metaService = metaService;
    this.titleService = titleService;

    if (isPlatformServer(this.platformId) && this.base_url) {
      this.domain = 'base_url';
    } else if (request) {
      const host = request.headers.get('host') ?? '';
      const url = request.url;
      const protocol = url.startsWith('https') ? 'https' : 'http';

      this.domain = `${protocol}://${host}`;
    } else {
      this.domain = this.document.location.origin;
    }
  }

  public setOpenGraph(config: PageSeoConfig) {
    if (config.title) {
      this.setMetaTag('og:title', config.title);
    }
    if (config.description) {
      this.setMetaTag('og:description', config.description);
    } else {
      this.deleteMetaTag('og:description');
    }
    if (config.image) {
      let urlImage: string;
      if (config.image.startsWith('http')) {
        urlImage = config.image;
      } else {
        urlImage = `${this.domain}${config.image}`;
      }
      this.setMetaTag('og:image', urlImage);
    } else {
      this.deleteMetaTag('og:image');
    }
    if (config.slug) {
      this.setMetaTag('og:url', `${this.domain}${config.slug}`);
    } else {
      this.deleteMetaTag('og:url');
    }
  }

  public setCanonical(url: string | null | undefined) {
    const head = this.document.getElementsByTagName('head')[0];
    var element: HTMLLinkElement | null =
      this.document.querySelector("link[rel='canonical']") || null;

    if (url !== null && url !== undefined) {
      if (element === null) {
        element = this.document.createElement('link') as HTMLLinkElement;
        head.appendChild(element);
      }
      element.setAttribute('rel', 'canonical');
      element.setAttribute('href', `${this.domain}${url}`);
    } else {
      if (element !== null) {
        head.removeChild(element);
      }
    }
  }
  public setMetaTag(tag: string, value: string) {
    if (this.metaService.getTag(`name='${tag}'`) != null) {
      this.metaService.removeTag(`name='${tag}'`);
    }
    this.metaService.updateTag({ name: tag, content: value });
  }

  public generateTags(config: PageSeoConfig) {
    if (!config.tags) {
      config.tags = {
        twitter: true,
        openGraph: true,
        canonical: true,
      };
    }

    if (config.slug && config.slug[0] !== '/') {
      config.slug = '/' + config.slug;
    }

    if (config.title) {
      this.titleService.setTitle(config.title);
    }
    this.setMetaTags(config);
    if (config.tags.twitter !== false) {
      this.setTwitterCard(config);
    }

    if (config.tags.openGraph !== false) {
      this.setOpenGraph(config);
    }
    if (config.tags.canonical !== false) {
      this.setCanonical(config.slug);
    }
  }

  setMetaTags(config: PageSeoConfig) {
    const description = config.description;

    if (description) {
      this.setMetaTag('description', description);
    } else {
      this.deleteMetaTag('description');
    }
    if (config.keywords) {
      this.setMetaTag('keywords', config.keywords);
    } else {
      this.deleteMetaTag('keywords');
    }
  }

  public deleteMetaTag(tag: string) {
    const element = this.metaService.getTag(`name='${tag}'`);
    if (element != null) {
      this.metaService.removeTagElement(element);
    }
  }

  public setTwitterCard(config: PageSeoConfig) {
    this.setMetaTag('twitter:card', 'summary');
    if (config.title) {
      this.setMetaTag('twitter:title', config.title);
    }
    if (config.description) {
      this.setMetaTag('twitter:description', config.description);
    } else {
      this.deleteMetaTag('twitter:description');
    }
    if (config.image) {
      let urlImage: string;
      if (config.image.startsWith('http')) {
        urlImage = config.image;
      } else {
        urlImage = `${this.domain}${config.image}`;
      }
      this.setMetaTag('twitter:image', urlImage);
    } else {
      this.deleteMetaTag('twitter:image');
    }
  }
}

export interface PageSeoConfig {
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  slug?: string | undefined;
  keywords?: string | undefined;
  tags?:
    | {
        twitter?: boolean | undefined;
        openGraph?: boolean | undefined;
        canonical?: boolean | undefined;
      }
    | undefined;
}
