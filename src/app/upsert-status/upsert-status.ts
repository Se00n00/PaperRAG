import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-upsert-status',
  imports: [CommonModule],
  templateUrl: './upsert-status.html',
  styleUrl: './upsert-status.css'
})
export class UpsertStatus {
  @Input() title = 'Attention is all you need'
  @Input() author = 'Vaswani et al.'
  @Input() year = 2017
  @Input() status = 1
  @Output() close_window = new EventEmitter<boolean>();

  close(){
    if(this.status != 0){
      this.close_window.emit(true)
    }
  }
}
