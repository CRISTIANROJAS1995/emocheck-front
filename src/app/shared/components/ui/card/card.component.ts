import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'emo-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss']
})
export class EmoCardComponent {
    @Input() padding: string = '24px';
    @Input() borderRadius: string = '16px';
    @Input() shadow: boolean = true;
}
