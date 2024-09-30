# SeoToolbox


## SSR
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

```typescript
interface PageSeoConfig {
  title?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
  slug?: string | undefined;
  keywords?: string | undefined;
  tags:{
    twitter?:boolean,
    openGraph?:boolean,
    canonical?:boolean
  }
}
```

```
generateTags(config: PageSeoConfig)
```
