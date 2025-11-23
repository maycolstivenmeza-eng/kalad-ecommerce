import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type UiMessageType = "info" | "success" | "error";

export interface UiMessage {
  type: UiMessageType;
  text: string;
}

@Injectable({
  providedIn: "root"
})
export class UiMessageService {
  private messageSubject = new BehaviorSubject<UiMessage | null>(null);
  readonly message$ = this.messageSubject.asObservable();
  private timeoutId: any;

  show(type: UiMessageType, text: string, durationMs = 4000): void {
    this.messageSubject.next({ type, text });
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.clear();
    }, durationMs);
  }

  info(text: string, durationMs?: number): void {
    this.show("info", text, durationMs);
  }

  success(text: string, durationMs?: number): void {
    this.show("success", text, durationMs);
  }

  error(text: string, durationMs?: number): void {
    this.show("error", text, durationMs);
  }

  clear(): void {
    this.messageSubject.next(null);
  }
}

