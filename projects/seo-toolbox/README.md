# SeoToolbox


## SSR Angular < 19
To configure the SSR, you need to add the url domain inside the `server.ts` file.

```typescript
 // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: BASE_URL_DOMAIN, useValue: `${protocol}://${headers.host}` }, // <--- Add this line
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

```


## Usage
Here is the types you can pass to the service:

```typescript
export interface PageSeoConfig {
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  slug?: string | undefined;
  keywords?: string | undefined;
  tags?:
    | PageSeoTagsConfig
    | undefined;
  alternates?:PageSeoAlternateConfig[] | undefined;
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

```
Here is a usage example:
```
export class Page1Component {
  constructor(seoTagsService: SeoTagsService) {
    seoTagsService.generateTags({
      title: 'Page 1',
      description: 'Page 1 Description',
      slug: 'page1',
      keywords: 'page 1, angular, seo, example',
      alternates:[
        {
          lang:'en',
          url:'/page1?lang=en',
        },
        {
          lang:'fr',
          url:'/page1?lang=fr',
        }
      ]
    });
  }
}
```
