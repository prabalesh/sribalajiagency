import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';

@Component({
    selector: 'app-social-section',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './social-section.component.html',
    styleUrl: './social-section.component.scss'
})
export class SocialSectionComponent {
    readonly ExternalLink = ExternalLink;

    @Input() socialLinks: any[] = [];
}
