import { Component } from '@angular/core';
import { SeoTagsService } from '../../../../../seo-toolbox/src/lib/seo-tags.service';

@Component({
  selector: 'doc-page1',
  imports: [],
  templateUrl: './page1.component.html',
  styleUrl: './page1.component.scss',
})
export class Page1Component {
  constructor(seoTagsService: SeoTagsService) {
    seoTagsService.generateTags({
      title: 'Page 1',
      description: 'Page 1 Description',
      slug: 'page1',
      keywords: 'page 1, angular, seo, example',
    });
  }
}
