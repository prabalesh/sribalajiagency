import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Upload, Link, X, Image as ImageIcon, AlertCircle } from 'lucide-angular';
import { DragDropDirective } from '../../directives/drag-drop.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DragDropDirective],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss'
})
export class ImageUploaderComponent implements OnInit {
  @Input() initialUrl: string | null = null;
  @Input() label: string = 'Image';
  @Input() helpText: string = 'PNG, JPG or GIF (max. 5MB)';
  @Input() required: boolean = false;
  @Input() maxSize: number = 5; // MB

  @Output() fileSelected = new EventEmitter<File>();
  @Output() urlChanged = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  private toastService = inject(ToastService);

  readonly Upload = Upload;
  readonly Link = Link;
  readonly X = X;
  readonly ImageIcon = ImageIcon;
  readonly AlertCircle = AlertCircle;

  mode: 'upload' | 'link' = 'upload';
  externalUrl: string = '';
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  ngOnInit() {
    if (this.initialUrl) {
      this.previewUrl = this.getFullUrl(this.initialUrl);
      if (this.initialUrl.startsWith('http') && !this.initialUrl.includes('localhost:3000')) {
        this.mode = 'link';
        this.externalUrl = this.initialUrl;
      }
    }
  }

  setMode(mode: 'upload' | 'link') {
    this.mode = mode;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileDropped(files: FileList) {
    if (files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toastService.error('Only image files are allowed');
      return;
    }

    if (file.size > this.maxSize * 1024 * 1024) {
      this.toastService.error(`File size exceeds ${this.maxSize}MB limit`);
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
    this.fileSelected.emit(file);
  }

  onUrlChange() {
    this.previewUrl = this.externalUrl;
    this.urlChanged.emit(this.externalUrl);
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    this.externalUrl = '';
    this.imageRemoved.emit();
  }

  private getFullUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  }
}
