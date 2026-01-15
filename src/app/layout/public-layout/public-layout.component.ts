import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Router, RouterModule } from '@angular/router'; // Import Router and RouterModule (includes Outlet, Link, Active)
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {
  searchQuery: string = '';
  isSearchOpen = false;

  constructor(private router: Router) { }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    // Auto focus logic could be added here with ViewChild but simple toggle is fine for now
    if (!this.isSearchOpen) {
      this.searchQuery = '';
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.isSearchOpen = false;
      this.searchQuery = '';
    }
  }
}
