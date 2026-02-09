import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/store/theme.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LucideAngularModule, BarChart3, Users, FolderTree, Tag, Package, ShoppingCart, Ticket, Shield, Home, MessageSquare, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  themeService = inject(ThemeService);
  authService = inject(AuthService);

  // Icon references for template
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly FolderTree = FolderTree;
  readonly Tag = Tag;
  readonly Package = Package;
  readonly ShoppingCart = ShoppingCart;
  readonly Ticket = Ticket;
  readonly Shield = Shield;
  readonly Home = Home;
  readonly MessageSquare = MessageSquare;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly Menu = Menu;
  readonly X = X;
  readonly Sun = Sun;
  readonly Moon = Moon;

  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 1024) {
      this.isSidebarOpen = false;
    }
  }
}
