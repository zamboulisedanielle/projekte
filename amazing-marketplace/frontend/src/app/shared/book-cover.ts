import { Component, computed, input } from '@angular/core';

// Cloth colours of classic hardcover bindings.
const CLOTH = ['#1E2A4A', '#5B1F2A', '#1F4A3A', '#6B4E1F', '#3B3355', '#2F4858', '#7A3B2E', '#40513B'];

/** Typographic book cover generated from title and author, no images needed. */
@Component({
  selector: 'app-book-cover',
  template: `
    <div class="cover" [class.small]="size() === 'small'" [style.background]="color()">
      <span class="title">{{ title() }}</span>
      <span class="rule"></span>
      <span class="author">{{ author() }}</span>
    </div>
  `,
  styles: `
    .cover {
      aspect-ratio: 2 / 3;
      width: 100%;
      border-radius: 2px 6px 6px 2px;
      padding: 14% 12%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      color: #f3ead8;
      box-shadow: inset 6px 0 0 rgba(0, 0, 0, 0.18), 0 1px 2px rgba(20, 24, 40, 0.25);
      overflow: hidden;
    }
    .title {
      font-family: 'Literata', Georgia, serif;
      font-weight: 600;
      font-size: 1.05rem;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .rule { width: 28px; height: 2px; background: #c9a24d; }
    .author { font-size: 0.75rem; opacity: 0.85; }
    .small { padding: 10% 10%; gap: 4px; }
    .small .title { font-size: 0.62rem; -webkit-line-clamp: 3; }
    .small .rule { width: 14px; height: 1px; }
    .small .author { display: none; }
  `,
})
export class BookCover {
  title = input.required<string>();
  author = input<string>('');
  size = input<'normal' | 'small'>('normal');

  color = computed(() => {
    let h = 0;
    for (const ch of this.title()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return CLOTH[h % CLOTH.length];
  });
}
