import { Component } from '@angular/core';
import { SeoTagsService } from '../../../../../seo-toolbox/src/lib/seo-tags.service';

@Component({
  selector: 'doc-page2',
  imports: [],
  templateUrl: './page2.component.html',
  styleUrl: './page2.component.scss',
})
export class Page2Component {
  constructor(seoTagsService: SeoTagsService) {
    seoTagsService.generateTags({
      title: 'Page 2',
      description: 'Page 2 Description',
      slug: 'page2',
      keywords: 'page 2, angular, seo, example',
    });
  }
}
