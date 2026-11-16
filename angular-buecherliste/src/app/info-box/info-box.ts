import { Component } from '@angular/core';

@Component({
  selector: 'app-info-box',
  standalone: true,
  imports: [],
  templateUrl: './info-box.html',
  styleUrl: './info-box.scss',
})
export class InfoBox {
  text = "Additional Info-Text on our Info Box! 🎊";
  showInfo = false;
}