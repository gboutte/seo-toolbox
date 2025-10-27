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
  private request: Request | null;

  constructor(
    metaService: Meta,
    titleService: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    @Optional() @Inject(REQUEST) request: Request | null,
    @Optional() @Inject(BASE_URL_DOMAIN) private base_url: string,
  ) {
    this.metaService = metaService;
    this.titleService = titleService;
    this.request = request;

    this.domain = this.getCurrentDomain();
  }

  public getCurrentDomain(): string {
    let domain: string;
    if (isPlatformServer(this.platformId) && this.base_url) {
      domain = this.base_url;
    } else if (this.request) {
      const host = this.request.headers.get('host') ?? '';
      const url = this.request.url;
      const protocol = url.startsWith('https') ? 'https' : 'http';

      domain = `${protocol}://${host}`;
    } else {
      domain = this.document.location.origin;
    }
    return domain;
  }

  public setOpenGraph(config: PageSeoConfig, patchMode: boolean = false) {
    if (config.title) {
      this.setMetaTag('og:title', config.title);
    } else if (!patchMode) {
      this.deleteMetaTag('og:title');
    }
    if (config.description) {
      this.setMetaTag('og:description', config.description);
    } else if (!patchMode) {
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
    } else if (!patchMode) {
      this.deleteMetaTag('og:image');
    }
    if (config.slug) {
      this.setMetaTag('og:url', `${this.domain}${config.slug}`);
    } else if (!patchMode) {
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

  public setAlternates(alts: PageSeoAlternateConfig[] | null) {
    const head = this.document.getElementsByTagName('head')[0];
    var elements = this.document.querySelectorAll("link[rel='alternate']");

    //Remove all the alternate
    if (elements !== null) {
      for (const element of elements) {
        head.removeChild(element);
      }
    }

    if (alts !== null) {
      for (const alt of alts) {
        const newAlternate = this.document.createElement('link');
        head.appendChild(newAlternate);

        newAlternate.setAttribute('rel', 'alternate');
        newAlternate.setAttribute('href', `${this.domain}${alt.url}`);
        newAlternate.setAttribute('hreflang', `${alt.lang}`);
      }
    }
  }

  public setMetaTag(tag: string, value: string) {
    if (this.metaService.getTag(`name='${tag}'`) != null) {
      this.metaService.removeTag(`name='${tag}'`);
    }
    this.metaService.updateTag({ name: tag, content: value });
  }

  public generateTags(config: PageSeoConfig, patchMode: boolean = false) {
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
    } else if (!patchMode) {
      //Remove title tag
      this.titleService.setTitle('');
    }
    this.setMetaTags(config, patchMode);
    if (config.tags.twitter !== false) {
      this.setTwitterCard(config, patchMode);
    }

    if (config.tags.openGraph !== false) {
      this.setOpenGraph(config);
    }
    if (config.tags.canonical !== false && config.slug !== undefined) {
      this.setCanonical(config.slug);
    } else if (!patchMode) {
      this.setCanonical(null);
    }
    if (config.alternates) {
      this.setAlternates(config.alternates);
    } else if (!patchMode) {
      this.setAlternates(null);
    }
  }

  setMetaTags(config: PageSeoConfig, patchMode: boolean = false) {
    const description = config.description;

    if (description) {
      this.setMetaTag('description', description);
    } else if (!patchMode) {
      this.deleteMetaTag('description');
    }
    if (config.keywords) {
      this.setMetaTag('keywords', config.keywords);
    } else if (!patchMode) {
      this.deleteMetaTag('keywords');
    }
  }

  public deleteMetaTag(tag: string) {
    const element = this.metaService.getTag(`name='${tag}'`);
    if (element != null) {
      this.metaService.removeTagElement(element);
    }
  }

  public setTwitterCard(config: PageSeoConfig, patchMode: boolean = false) {
    this.setMetaTag('twitter:card', 'summary');
    if (config.title) {
      this.setMetaTag('twitter:title', config.title);
    } else if (!patchMode) {
      this.deleteMetaTag('twitter:title');
    }
    if (config.description) {
      this.setMetaTag('twitter:description', config.description);
    } else if (!patchMode) {
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
    } else if (!patchMode) {
      this.deleteMetaTag('twitter:image');
    }
  }

  public resetTags() {
    this.resetOpenGraph();
    this.resetTwitterCard();
    this.resetMetaTags();
    this.resetCanonical();
  }

  public resetOpenGraph() {
    this.deleteMetaTag('og:title');
    this.deleteMetaTag('og:description');
    this.deleteMetaTag('og:image');
    this.deleteMetaTag('og:url');
  }

  public resetTwitterCard() {
    this.deleteMetaTag('twitter:card');
    this.deleteMetaTag('twitter:title');
    this.deleteMetaTag('twitter:description');
    this.deleteMetaTag('twitter:image');
  }

  public resetMetaTags() {
    this.deleteMetaTag('description');
    this.deleteMetaTag('keywords');
  }

  public resetCanonical() {
    this.setCanonical(null);
  }
}

export interface PageSeoConfig {
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  slug?: string | undefined;
  keywords?: string | undefined;
  tags?: PageSeoTagsConfig | undefined;
  alternates?: PageSeoAlternateConfig[] | undefined;
}

export interface PageSeoTagsConfig {
  twitter?: boolean | undefined;
  openGraph?: boolean | undefined;
  canonical?: boolean | undefined;
}

export interface PageSeoAlternateConfig {
  lang: string;
  url: string;
}
