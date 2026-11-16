import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InfoBox } from './info-box/info-box';
import { BookList } from './book-list/book-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InfoBox, BookList],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}