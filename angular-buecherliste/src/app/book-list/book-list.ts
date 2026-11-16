import { Component } from '@angular/core';
import { BookData } from "../book-data";
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-book-list',
  imports: [AsyncPipe],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
})
export class BookList {
  /*books = [
    { title: 'Harry Potter', subtitle: 'À l’école des sorciers' },
    { title: 'Le Petit Prince', subtitle: 'Antoine de Saint-Exupéry' },
    { title: 'Les Misérables', subtitle: 'Victor Hugo' }
  ];*/

  /*books: { title: string; subtitle: string; }[];

  constructor(private bookData: BookData) {
    this.books = this.bookData.getBooks();
  }*/

  books$: Observable<any>;
  constructor(private bookData: BookData) {
    this.books$ = this.bookData.getBooks();
  }
}