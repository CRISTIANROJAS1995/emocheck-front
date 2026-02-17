import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-feature-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-feature-card.component.html',
    styleUrls: ['./admin-feature-card.component.scss'],
})
export class AdminFeatureCardComponent {
    @Input() title = '';
    @Input() description = '';
    @Input() icon = '';
    @Input() route = '';
    @Input() metric = '-';
}
