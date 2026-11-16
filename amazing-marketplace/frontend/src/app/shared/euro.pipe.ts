import { Pipe, PipeTransform } from '@angular/core';

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** 1299 -> "12,99 €" */
@Pipe({ name: 'euro' })
export class EuroPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    return fmt.format((cents ?? 0) / 100);
  }
}
