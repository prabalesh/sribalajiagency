import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-about-section',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './about-section.component.html',
    styleUrl: './about-section.component.scss'
})
export class AboutSectionComponent {
    @Input() cms: any;
}
