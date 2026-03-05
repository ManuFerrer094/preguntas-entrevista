import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContentStore } from '../../core/stores/content.store';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" class="hero-title">Preguntas de Entrevistas Técnicas</h1>
      <p class="hero-subtitle">
        Prepárate para tus entrevistas con preguntas reales organizadas por tecnología.
        Contenido actualizado y contribuciones open source bienvenidas.
      </p>
    </section>

    <section aria-label="Tecnologías disponibles">
      <h2 class="section-title">Tecnologías</h2>
      <div class="technologies-grid">
        @for (tech of store.technologies(); track tech.id) {
          <mat-card class="tech-card" [style.--tech-color]="tech.color">
            <mat-card-header>
              <mat-card-title>
                <mat-icon class="tech-icon" [style.color]="tech.color">{{ tech.icon }}</mat-icon>
                {{ tech.name }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>{{ tech.description }}</p>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button [routerLink]="['/', tech.slug]" [attr.aria-label]="'Ver preguntas de ' + tech.name">
                Ver preguntas
                <mat-icon>arrow_forward</mat-icon>
              </a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </section>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 48px 0 64px;
    }
    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .hero-subtitle {
      font-size: 1.125rem;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .technologies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    .tech-card {
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .tech-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .tech-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    mat-card-title {
      display: flex;
      align-items: center;
    }
    @media (max-width: 600px) {
      .hero-title { font-size: 1.75rem; }
      .technologies-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements OnInit {
  store = inject(ContentStore);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setPageMeta({
      title: 'Inicio',
      description: 'Preguntas típicas de entrevistas técnicas para Angular, React, Vue, Node.js, TypeScript, JavaScript, Testing y System Design.',
      keywords: 'entrevistas técnicas, angular, react, vue, nodejs, typescript, javascript, preguntas'
    });
  }
}
