import { CommonModule, formatDate } from '@angular/common';
import { Component } from '@angular/core';
import { RecentDocumentsFeedComponent } from './recent-documents-feed/recent-documents-feed.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RecentDocumentsFeedComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly versionLabel = this.formatVersionLabel();

  private formatVersionLabel(): string {
    const now = new Date();
    const date = formatDate(now, 'MMM d', 'en-US');
    const time = formatDate(now, 'HH:mm', 'en-US').replace(':', 'h');
    return `${date} / ${time}`;
  }
}
