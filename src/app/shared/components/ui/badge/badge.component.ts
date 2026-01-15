import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'emo-badge',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './badge.component.html',
    styleUrls: ['./badge.component.scss']
})
export class EmoBadgeComponent {
    @Input() icon: string = '';
    @Input() iconSize: number = 12;
}
