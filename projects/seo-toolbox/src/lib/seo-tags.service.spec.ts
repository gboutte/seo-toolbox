import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_DOMAIN } from './domain.token';
import { SeoTagsService } from './seo-tags.service';

describe('SeoTagsService', () => {
  let service: SeoTagsService;
  let doc: Document;

  function cleanDom(): void {
    doc.querySelectorAll('meta[name^="og:"]').forEach((el) => el.remove());
    doc.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
    doc.querySelectorAll('meta[name^="twitter:"]').forEach((el) => el.remove());
    doc
      .querySelectorAll('meta[name="description"]')
      .forEach((el) => el.remove());
    doc.querySelectorAll('meta[name="keywords"]').forEach((el) => el.remove());
    doc.querySelectorAll("link[rel='canonical']").forEach((el) => el.remove());
    doc.querySelectorAll("link[rel='alternate']").forEach((el) => el.remove());
  }

  function setupBrowserTestBed(extraProviders: unknown[] = []): void {
    TestBed.configureTestingModule({
      providers: [
        SeoTagsService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: REQUEST, useValue: null },
        { provide: BASE_URL_DOMAIN, useValue: null },
        ...extraProviders,
      ],
    });
    service = TestBed.inject(SeoTagsService);
    doc = TestBed.inject(DOCUMENT);
  }

  afterEach(() => {
    cleanDom();
    TestBed.resetTestingModule();
  });

  // ---------------------------------------------------------------------------
  // getCurrentDomain
  // ---------------------------------------------------------------------------

  describe('getCurrentDomain', () => {
    it('returns document.location.origin in browser', () => {
      setupBrowserTestBed();
      expect(service.getCurrentDomain()).toBe(doc.location.origin);
    });

    it('returns BASE_URL_DOMAIN on server when provided', () => {
      TestBed.configureTestingModule({
        providers: [
          SeoTagsService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: null },
          { provide: BASE_URL_DOMAIN, useValue: 'https://example.com' },
        ],
      });
      const serverService = TestBed.inject(SeoTagsService);
      expect(serverService.getCurrentDomain()).toBe('https://example.com');
    });

    it('derives domain from request headers on server when BASE_URL_DOMAIN is absent', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => (key === 'host' ? 'example.com' : null),
        },
        url: 'https://example.com/page',
      } as unknown as Request;

      TestBed.configureTestingModule({
        providers: [
          SeoTagsService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockRequest },
          { provide: BASE_URL_DOMAIN, useValue: null },
        ],
      });
      const serverService = TestBed.inject(SeoTagsService);
      expect(serverService.getCurrentDomain()).toBe('https://example.com');
    });

    it('uses http protocol when request URL starts with http', () => {
      const mockRequest = {
        headers: {
          get: (key: string) => (key === 'host' ? 'example.com' : null),
        },
        url: 'http://example.com/page',
      } as unknown as Request;

      TestBed.configureTestingModule({
        providers: [
          SeoTagsService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: REQUEST, useValue: mockRequest },
          { provide: BASE_URL_DOMAIN, useValue: null },
        ],
      });
      const serverService = TestBed.inject(SeoTagsService);
      expect(serverService.getCurrentDomain()).toBe('http://example.com');
    });
  });

  // ---------------------------------------------------------------------------
  // setOpenGraph
  // ---------------------------------------------------------------------------

  describe('setOpenGraph', () => {
    beforeEach(() => setupBrowserTestBed());

    it('sets og:title using the property attribute (not name)', () => {
      service.setOpenGraph({ title: 'Test Title' });
      const tag = doc.querySelector("meta[property='og:title']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe('Test Title');
    });

    it('does not create og:title with the name attribute', () => {
      service.setOpenGraph({ title: 'Test Title' });
      expect(doc.querySelector("meta[name='og:title']")).toBeNull();
    });

    it('sets og:description using the property attribute', () => {
      service.setOpenGraph({ description: 'Test Description' });
      const tag = doc.querySelector("meta[property='og:description']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe('Test Description');
    });

    it('sets og:image keeping an absolute URL unchanged', () => {
      service.setOpenGraph({ image: 'https://cdn.example.com/image.png' });
      const tag = doc.querySelector("meta[property='og:image']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe(
        'https://cdn.example.com/image.png',
      );
    });

    it('prepends the current domain to a relative og:image', () => {
      service.setOpenGraph({ image: '/images/hero.png' });
      const tag = doc.querySelector("meta[property='og:image']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe(
        `${doc.location.origin}/images/hero.png`,
      );
    });

    it('sets og:url as domain + slug', () => {
      service.setOpenGraph({ slug: '/about' });
      const tag = doc.querySelector("meta[property='og:url']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe(`${doc.location.origin}/about`);
    });

    it('removes og:title when title is absent and patchMode is false', () => {
      service.setOpenGraph({ title: 'Title' });
      service.setOpenGraph({ description: 'Only desc' }, false);
      expect(doc.querySelector("meta[property='og:title']")).toBeNull();
    });

    it('keeps og:title when title is absent but patchMode is true', () => {
      service.setOpenGraph({ title: 'Title' });
      service.setOpenGraph({ description: 'Only desc' }, true);
      expect(
        doc.querySelector("meta[property='og:title']")?.getAttribute('content'),
      ).toBe('Title');
    });

    it('removes og:description when absent and patchMode is false', () => {
      service.setOpenGraph({ description: 'Desc' });
      service.setOpenGraph({ title: 'Only title' }, false);
      expect(doc.querySelector("meta[property='og:description']")).toBeNull();
    });

    it('removes og:image when absent and patchMode is false', () => {
      service.setOpenGraph({ image: '/img.png' });
      service.setOpenGraph({ title: 'No image' }, false);
      expect(doc.querySelector("meta[property='og:image']")).toBeNull();
    });

    it('removes og:url when slug is absent and patchMode is false', () => {
      service.setOpenGraph({ slug: '/page' });
      service.setOpenGraph({ title: 'No slug' }, false);
      expect(doc.querySelector("meta[property='og:url']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // setTwitterCard
  // ---------------------------------------------------------------------------

  describe('setTwitterCard', () => {
    beforeEach(() => setupBrowserTestBed());

    it('always sets twitter:card to summary', () => {
      service.setTwitterCard({});
      const tag = doc.querySelector("meta[name='twitter:card']");
      expect(tag).not.toBeNull();
      expect(tag!.getAttribute('content')).toBe('summary');
    });

    it('sets twitter:title', () => {
      service.setTwitterCard({ title: 'TW Title' });
      expect(
        doc
          .querySelector("meta[name='twitter:title']")
          ?.getAttribute('content'),
      ).toBe('TW Title');
    });

    it('sets twitter:description', () => {
      service.setTwitterCard({ description: 'TW Desc' });
      expect(
        doc
          .querySelector("meta[name='twitter:description']")
          ?.getAttribute('content'),
      ).toBe('TW Desc');
    });

    it('keeps an absolute twitter:image URL unchanged', () => {
      service.setTwitterCard({ image: 'https://cdn.example.com/image.png' });
      expect(
        doc
          .querySelector("meta[name='twitter:image']")
          ?.getAttribute('content'),
      ).toBe('https://cdn.example.com/image.png');
    });

    it('prepends domain to a relative twitter:image', () => {
      service.setTwitterCard({ image: '/images/hero.png' });
      expect(
        doc
          .querySelector("meta[name='twitter:image']")
          ?.getAttribute('content'),
      ).toBe(`${doc.location.origin}/images/hero.png`);
    });

    it('removes twitter:title when absent and patchMode is false', () => {
      service.setTwitterCard({ title: 'Title' });
      service.setTwitterCard({ description: 'Desc' }, false);
      expect(doc.querySelector("meta[name='twitter:title']")).toBeNull();
    });

    it('keeps twitter:title when absent but patchMode is true', () => {
      service.setTwitterCard({ title: 'Title' });
      service.setTwitterCard({ description: 'Desc' }, true);
      expect(
        doc
          .querySelector("meta[name='twitter:title']")
          ?.getAttribute('content'),
      ).toBe('Title');
    });

    it('removes twitter:description when absent and patchMode is false', () => {
      service.setTwitterCard({ description: 'Desc' });
      service.setTwitterCard({ title: 'Title' }, false);
      expect(doc.querySelector("meta[name='twitter:description']")).toBeNull();
    });

    it('removes twitter:image when absent and patchMode is false', () => {
      service.setTwitterCard({ image: '/img.png' });
      service.setTwitterCard({ title: 'Title' }, false);
      expect(doc.querySelector("meta[name='twitter:image']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // setCanonical
  // ---------------------------------------------------------------------------

  describe('setCanonical', () => {
    beforeEach(() => setupBrowserTestBed());

    it('creates a canonical link element with domain + url', () => {
      service.setCanonical('/page1');
      const link = doc.querySelector("link[rel='canonical']");
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toBe(`${doc.location.origin}/page1`);
    });

    it('updates the existing canonical link without creating a duplicate', () => {
      service.setCanonical('/page1');
      service.setCanonical('/page2');
      const links = doc.querySelectorAll("link[rel='canonical']");
      expect(links.length).toBe(1);
      expect(links[0].getAttribute('href')).toBe(
        `${doc.location.origin}/page2`,
      );
    });

    it('removes the canonical link when url is null', () => {
      service.setCanonical('/page1');
      service.setCanonical(null);
      expect(doc.querySelector("link[rel='canonical']")).toBeNull();
    });

    it('removes the canonical link when url is undefined', () => {
      service.setCanonical('/page1');
      service.setCanonical(undefined);
      expect(doc.querySelector("link[rel='canonical']")).toBeNull();
    });

    it('does nothing when removing a canonical that does not exist', () => {
      expect(() => service.setCanonical(null)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // setAlternates
  // ---------------------------------------------------------------------------

  describe('setAlternates', () => {
    beforeEach(() => setupBrowserTestBed());

    it('creates one link element per alternate', () => {
      service.setAlternates([
        { lang: 'en', url: '/page?lang=en' },
        { lang: 'fr', url: '/page?lang=fr' },
      ]);
      const links = doc.querySelectorAll("link[rel='alternate']");
      expect(links.length).toBe(2);
    });

    it('sets hreflang and href on each alternate element', () => {
      service.setAlternates([{ lang: 'en', url: '/page?lang=en' }]);
      const link = doc.querySelector("link[rel='alternate']");
      expect(link!.getAttribute('hreflang')).toBe('en');
      expect(link!.getAttribute('href')).toBe(
        `${doc.location.origin}/page?lang=en`,
      );
    });

    it('removes all alternate links when called with null', () => {
      service.setAlternates([{ lang: 'en', url: '/page?lang=en' }]);
      service.setAlternates(null);
      expect(doc.querySelectorAll("link[rel='alternate']").length).toBe(0);
    });

    it('replaces existing alternates on a second call', () => {
      service.setAlternates([{ lang: 'en', url: '/page?lang=en' }]);
      service.setAlternates([
        { lang: 'de', url: '/page?lang=de' },
        { lang: 'es', url: '/page?lang=es' },
      ]);
      const links = doc.querySelectorAll("link[rel='alternate']");
      expect(links.length).toBe(2);
      expect(links[0].getAttribute('hreflang')).toBe('de');
    });
  });

  // ---------------------------------------------------------------------------
  // setMetaTags
  // ---------------------------------------------------------------------------

  describe('setMetaTags', () => {
    beforeEach(() => setupBrowserTestBed());

    it('sets meta description', () => {
      service.setMetaTags({ description: 'Page description' });
      expect(
        doc.querySelector("meta[name='description']")?.getAttribute('content'),
      ).toBe('Page description');
    });

    it('sets meta keywords', () => {
      service.setMetaTags({ keywords: 'angular, seo, test' });
      expect(
        doc.querySelector("meta[name='keywords']")?.getAttribute('content'),
      ).toBe('angular, seo, test');
    });

    it('removes description when absent and patchMode is false', () => {
      service.setMetaTags({ description: 'Desc' });
      service.setMetaTags({ keywords: 'kw' }, false);
      expect(doc.querySelector("meta[name='description']")).toBeNull();
    });

    it('keeps description when absent but patchMode is true', () => {
      service.setMetaTags({ description: 'Desc' });
      service.setMetaTags({ keywords: 'kw' }, true);
      expect(
        doc.querySelector("meta[name='description']")?.getAttribute('content'),
      ).toBe('Desc');
    });

    it('removes keywords when absent and patchMode is false', () => {
      service.setMetaTags({ keywords: 'kw' });
      service.setMetaTags({ description: 'Desc' }, false);
      expect(doc.querySelector("meta[name='keywords']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // generateTags
  // ---------------------------------------------------------------------------

  describe('generateTags', () => {
    beforeEach(() => setupBrowserTestBed());

    it('sets the page title', () => {
      service.generateTags({ title: 'My Page' });
      expect(doc.title).toBe('My Page');
    });

    it('sets meta description and keywords', () => {
      service.generateTags({ description: 'My Desc', keywords: 'kw1, kw2' });
      expect(
        doc.querySelector("meta[name='description']")?.getAttribute('content'),
      ).toBe('My Desc');
      expect(
        doc.querySelector("meta[name='keywords']")?.getAttribute('content'),
      ).toBe('kw1, kw2');
    });

    it('sets OG tags with property attribute', () => {
      service.generateTags({
        title: 'OG Title',
        description: 'OG Desc',
        slug: '/page',
      });
      expect(
        doc.querySelector("meta[property='og:title']")?.getAttribute('content'),
      ).toBe('OG Title');
      expect(
        doc
          .querySelector("meta[property='og:description']")
          ?.getAttribute('content'),
      ).toBe('OG Desc');
      expect(
        doc.querySelector("meta[property='og:url']")?.getAttribute('content'),
      ).toBe(`${doc.location.origin}/page`);
    });

    it('sets Twitter card tags', () => {
      service.generateTags({ title: 'TW Title', description: 'TW Desc' });
      expect(
        doc.querySelector("meta[name='twitter:card']")?.getAttribute('content'),
      ).toBe('summary');
      expect(
        doc
          .querySelector("meta[name='twitter:title']")
          ?.getAttribute('content'),
      ).toBe('TW Title');
      expect(
        doc
          .querySelector("meta[name='twitter:description']")
          ?.getAttribute('content'),
      ).toBe('TW Desc');
    });

    it('sets the canonical link', () => {
      service.generateTags({ slug: '/about' });
      expect(
        doc.querySelector("link[rel='canonical']")?.getAttribute('href'),
      ).toBe(`${doc.location.origin}/about`);
    });

    it('prepends a slash to slug when missing', () => {
      service.generateTags({ slug: 'about' });
      expect(
        doc.querySelector("link[rel='canonical']")?.getAttribute('href'),
      ).toBe(`${doc.location.origin}/about`);
      expect(
        doc.querySelector("meta[property='og:url']")?.getAttribute('content'),
      ).toBe(`${doc.location.origin}/about`);
    });

    it('forwards patchMode to setOpenGraph so existing OG tags are preserved', () => {
      service.generateTags({ title: 'Original Title' });
      service.generateTags({ description: 'Only desc' }, true);
      expect(
        doc.querySelector("meta[property='og:title']")?.getAttribute('content'),
      ).toBe('Original Title');
    });

    it('skips OG tags when config.tags.openGraph is false', () => {
      service.generateTags({
        title: 'No OG',
        tags: { openGraph: false, twitter: true, canonical: true },
      });
      expect(doc.querySelector("meta[property='og:title']")).toBeNull();
    });

    it('skips Twitter tags when config.tags.twitter is false', () => {
      service.generateTags({
        title: 'No Twitter',
        tags: { twitter: false, openGraph: true, canonical: true },
      });
      expect(doc.querySelector("meta[name='twitter:title']")).toBeNull();
    });

    it('skips canonical when config.tags.canonical is false', () => {
      service.generateTags({
        slug: '/page',
        tags: { canonical: false, openGraph: true, twitter: true },
      });
      expect(doc.querySelector("link[rel='canonical']")).toBeNull();
    });

    it('sets alternate links', () => {
      service.generateTags({
        slug: '/page',
        alternates: [
          { lang: 'en', url: '/page?lang=en' },
          { lang: 'fr', url: '/page?lang=fr' },
        ],
      });
      expect(doc.querySelectorAll("link[rel='alternate']").length).toBe(2);
    });

    it('clears the title when title is absent and patchMode is false', () => {
      service.generateTags({ title: 'Original' });
      service.generateTags({ description: 'No title' }, false);
      expect(doc.title).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // resetOpenGraph
  // ---------------------------------------------------------------------------

  describe('resetOpenGraph', () => {
    beforeEach(() => setupBrowserTestBed());

    it('removes all OG meta tags', () => {
      service.setOpenGraph({
        title: 'T',
        description: 'D',
        image: '/i.png',
        slug: '/s',
      });
      service.resetOpenGraph();
      expect(doc.querySelector("meta[property='og:title']")).toBeNull();
      expect(doc.querySelector("meta[property='og:description']")).toBeNull();
      expect(doc.querySelector("meta[property='og:image']")).toBeNull();
      expect(doc.querySelector("meta[property='og:url']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // resetTwitterCard
  // ---------------------------------------------------------------------------

  describe('resetTwitterCard', () => {
    beforeEach(() => setupBrowserTestBed());

    it('removes all Twitter meta tags', () => {
      service.setTwitterCard({ title: 'T', description: 'D', image: '/i.png' });
      service.resetTwitterCard();
      expect(doc.querySelector("meta[name='twitter:card']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:title']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:description']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:image']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // resetMetaTags
  // ---------------------------------------------------------------------------

  describe('resetMetaTags', () => {
    beforeEach(() => setupBrowserTestBed());

    it('removes description and keywords meta tags', () => {
      service.setMetaTags({ description: 'Desc', keywords: 'kw' });
      service.resetMetaTags();
      expect(doc.querySelector("meta[name='description']")).toBeNull();
      expect(doc.querySelector("meta[name='keywords']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // resetCanonical
  // ---------------------------------------------------------------------------

  describe('resetCanonical', () => {
    beforeEach(() => setupBrowserTestBed());

    it('removes the canonical link', () => {
      service.setCanonical('/page');
      service.resetCanonical();
      expect(doc.querySelector("link[rel='canonical']")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // resetTags
  // ---------------------------------------------------------------------------

  describe('resetTags', () => {
    beforeEach(() => {
      setupBrowserTestBed();
      service.generateTags({
        title: 'Test',
        description: 'Desc',
        slug: '/test',
        keywords: 'kw',
        image: '/img.png',
        alternates: [{ lang: 'en', url: '/test?lang=en' }],
      });
    });

    it('removes all OG tags', () => {
      service.resetTags();
      expect(doc.querySelector("meta[property='og:title']")).toBeNull();
      expect(doc.querySelector("meta[property='og:description']")).toBeNull();
      expect(doc.querySelector("meta[property='og:image']")).toBeNull();
      expect(doc.querySelector("meta[property='og:url']")).toBeNull();
    });

    it('removes all Twitter tags', () => {
      service.resetTags();
      expect(doc.querySelector("meta[name='twitter:card']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:title']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:description']")).toBeNull();
      expect(doc.querySelector("meta[name='twitter:image']")).toBeNull();
    });

    it('removes meta description and keywords', () => {
      service.resetTags();
      expect(doc.querySelector("meta[name='description']")).toBeNull();
      expect(doc.querySelector("meta[name='keywords']")).toBeNull();
    });

    it('removes the canonical link', () => {
      service.resetTags();
      expect(doc.querySelector("link[rel='canonical']")).toBeNull();
    });
  });
});
