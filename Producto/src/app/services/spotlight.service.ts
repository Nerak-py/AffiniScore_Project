import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpotlightService {
  currentStep = signal<number>(-1);
  showOverlay = signal<boolean>(false);
}
