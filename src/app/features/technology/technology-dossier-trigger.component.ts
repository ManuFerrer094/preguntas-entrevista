import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  MfButtonComponent,
  MfIconComponent,
  MfProgressSpinnerComponent,
  MfSnackbarService,
} from 'ng-comps';
import { ContentStore } from '../../core/stores/content.store';
import { DossierService } from '../../core/services/dossier.service';

@Component({
  selector: 'app-technology-dossier-trigger',
  standalone: true,
  imports: [MfButtonComponent, MfIconComponent, MfProgressSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="dossier-trigger" (click)="openModal()">
      <mf-icon name="picture_as_pdf" color="inherit" />
      Generar dosier
    </button>

    @if (isOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <section
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-title"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-head">
            <div class="modal-copy">
              <p class="modal-kicker">PDF personalizado</p>
              <h2 id="dossier-title">Generar dosier</h2>
              <p class="modal-description">
                Selecciona una o varias tecnologías y generaremos un único PDF con portada, índice
                y todas las preguntas en formato libro.
              </p>
            </div>

            <button
              type="button"
              class="close-button"
              (click)="closeModal()"
              [disabled]="dossier.generating()"
              aria-label="Cerrar modal"
            >
              <mf-icon name="close" color="inherit" />
            </button>
          </div>

          <div class="selection-toolbar">
            <button
              type="button"
              class="toolbar-button"
              (click)="selectOnlyCurrent()"
              [disabled]="dossier.generating()"
            >
              Solo {{ currentTechnologyName() }}
            </button>
            <button
              type="button"
              class="toolbar-button"
              (click)="selectAll()"
              [disabled]="availableTechnologies().length === 0 || dossier.generating()"
            >
              Seleccionar todas
            </button>
            <button
              type="button"
              class="toolbar-button subtle"
              (click)="clearSelection()"
              [disabled]="selectedSlugs().length === 0 || dossier.generating()"
            >
              Limpiar
            </button>
          </div>

          @if (availableTechnologies().length > 0) {
            <div class="technology-grid">
              @for (technology of availableTechnologies(); track technology.slug) {
                <label class="technology-option" [class.selected]="isSelected(technology.slug)">
                  <input
                    type="checkbox"
                    [checked]="isSelected(technology.slug)"
                    [disabled]="dossier.generating()"
                    (change)="toggleTechnology(technology.slug)"
                  />
                  <div class="technology-copy">
                    <div class="technology-line">
                      <span class="technology-name">{{ technology.name }}</span>
                      @if (technology.slug === currentTechnologySlug()) {
                        <span class="current-badge">Actual</span>
                      }
                    </div>
                    <span class="technology-meta">{{ technology.questionCount }} preguntas</span>
                  </div>
                </label>
              }
            </div>
          } @else {
            <div class="empty-state">
              <mf-progress-spinner
                mode="indeterminate"
                [diameter]="28"
                label="Cargando tecnologías..."
              />
              <p>Estamos preparando el catálogo de tecnologías disponibles.</p>
            </div>
          }

          <div class="modal-summary">
            <span>{{ selectedSlugs().length }} tecnologías seleccionadas</span>
            <span>{{ totalSelectedQuestions() }} preguntas incluidas</span>
          </div>

          <div class="modal-actions">
            <mf-button
              label="Cancelar"
              variant="text"
              [disabled]="dossier.generating()"
              (mfClick)="closeModal()"
            />
            <mf-button
              [label]="dossier.generating() ? 'Generando PDF...' : 'Generar PDF'"
              variant="filled"
              leadingIcon="download"
              [disabled]="selectedSlugs().length === 0 || dossier.generating()"
              (mfClick)="generateDossier()"
            />
          </div>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .dossier-trigger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: var(--app-text);
        text-decoration: none;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition:
          border-color 0.2s,
          transform 0.2s,
          box-shadow 0.2s;
      }
      .dossier-trigger:hover {
        border-color: var(--app-primary);
        box-shadow: var(--app-shadow-sm);
        transform: translateY(-1px);
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 1200;
      }
      .modal-panel {
        width: min(760px, calc(100vw - 32px));
        max-height: calc(100vh - 40px);
        overflow: auto;
        border-radius: 24px;
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        box-shadow: var(--app-shadow-lg);
        padding: 24px;
      }
      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .modal-kicker {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--app-primary);
      }
      .modal-copy h2 {
        margin: 0 0 8px;
        font-size: 1.45rem;
      }
      .modal-description {
        margin: 0;
        color: var(--app-text-muted);
        line-height: 1.6;
      }
      .close-button,
      .toolbar-button {
        border: 1px solid var(--app-border);
        background: var(--app-surface);
        color: var(--app-text);
        font: inherit;
        cursor: pointer;
      }
      .close-button {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .close-button:disabled,
      .toolbar-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .selection-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 18px;
      }
      .toolbar-button {
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 0.84rem;
        font-weight: 600;
      }
      .toolbar-button.subtle {
        color: var(--app-text-muted);
      }
      .technology-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .technology-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        border: 1px solid var(--app-border);
        border-radius: 16px;
        background: var(--app-surface);
        cursor: pointer;
        transition:
          border-color 0.2s,
          transform 0.2s,
          box-shadow 0.2s;
      }
      .technology-option:hover {
        border-color: var(--app-primary);
        transform: translateY(-1px);
      }
      .technology-option.selected {
        border-color: var(--app-primary);
        background: color-mix(in srgb, var(--app-primary) 7%, var(--app-surface));
      }
      .technology-option input {
        margin-top: 2px;
        accent-color: var(--app-primary);
      }
      .technology-copy {
        min-width: 0;
      }
      .technology-line {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      .technology-name {
        font-weight: 700;
      }
      .technology-meta {
        color: var(--app-text-muted);
        font-size: 0.88rem;
      }
      .current-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-primary) 12%, transparent);
        color: var(--app-primary);
        font-size: 0.72rem;
        font-weight: 700;
      }
      .empty-state {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 0;
        color: var(--app-text-muted);
      }
      .empty-state p {
        margin: 0;
      }
      .modal-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--app-border);
        color: var(--app-text-muted);
        font-size: 0.92rem;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }
      @media (max-width: 720px) {
        .technology-grid {
          grid-template-columns: 1fr;
        }
        .modal-summary {
          flex-direction: column;
          align-items: flex-start;
        }
        .modal-actions {
          flex-direction: column-reverse;
        }
      }
    `,
  ],
})
export class TechnologyDossierTriggerComponent {
  readonly currentTechnologySlug = input.required<string>();
  readonly currentTechnologyName = input.required<string>();

  protected readonly store = inject(ContentStore);
  protected readonly dossier = inject(DossierService);
  private readonly snackbar = inject(MfSnackbarService);

  protected readonly isOpen = signal(false);
  protected readonly selectedSlugs = signal<string[]>([]);

  protected readonly availableTechnologies = computed(() => {
    const currentSlug = this.currentTechnologySlug();

    return this.store
      .technologies()
      .filter((technology) => technology.questionCount > 0)
      .slice()
      .sort((left, right) => {
        if (left.slug === currentSlug) return -1;
        if (right.slug === currentSlug) return 1;
        return left.name.localeCompare(right.name, 'es');
      });
  });

  protected readonly totalSelectedQuestions = computed(() => {
    const selected = new Set(this.selectedSlugs());
    return this.availableTechnologies().reduce(
      (total, technology) =>
        selected.has(technology.slug) ? total + technology.questionCount : total,
      0,
    );
  });

  protected openModal(): void {
    this.store.loadAllQuestionCounts();
    this.selectOnlyCurrent();
    this.isOpen.set(true);
  }

  protected closeModal(): void {
    if (this.dossier.generating()) return;
    this.isOpen.set(false);
  }

  protected isSelected(slug: string): boolean {
    return this.selectedSlugs().includes(slug);
  }

  protected toggleTechnology(slug: string): void {
    this.selectedSlugs.update((current) =>
      current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug],
    );
  }

  protected selectOnlyCurrent(): void {
    this.selectedSlugs.set([this.currentTechnologySlug()]);
  }

  protected selectAll(): void {
    this.selectedSlugs.set(this.availableTechnologies().map((technology) => technology.slug));
  }

  protected clearSelection(): void {
    this.selectedSlugs.set([]);
  }

  protected async generateDossier(): Promise<void> {
    try {
      await this.dossier.downloadDossier(this.selectedSlugs());
      this.isOpen.set(false);
    } catch {
      this.snackbar.error('No se pudo generar el dosier PDF', 'Cerrar');
    }
  }
}
