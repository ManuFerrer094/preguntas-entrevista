import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { routes as appRoutes } from './app.routes';

@Component({ selector: 'app-home-stub', standalone: true, template: '<p>home</p>' })
class HomeStubComponent {}

@Component({ selector: 'app-generic-stub', standalone: true, template: '<p>generic</p>' })
class GenericStubComponent {}

@Component({ selector: 'app-landing-stub', standalone: true, template: '<p>landing</p>' })
class TechnologyLandingStubComponent {}

@Component({ selector: 'app-questions-stub', standalone: true, template: '<p>questions</p>' })
class TechnologyQuestionsStubComponent {}

@Component({ selector: 'app-resources-stub', standalone: true, template: '<p>resources</p>' })
class TechnologyResourcesStubComponent {}

@Component({ selector: 'app-guide-stub', standalone: true, template: '<p>guide</p>' })
class TechnologyGuideStubComponent {}

@Component({ selector: 'app-topic-stub', standalone: true, template: '<p>topic</p>' })
class TechnologyTopicStubComponent {}

@Component({ selector: 'app-level-stub', standalone: true, template: '<p>level</p>' })
class TechnologyLevelStubComponent {}

@Component({ selector: 'app-detail-stub', standalone: true, template: '<p>detail</p>' })
class QuestionDetailStubComponent {}

function componentForPath(path: string | undefined): Type<unknown> {
  switch (path) {
    case '':
      return HomeStubComponent;
    case ':technology':
      return TechnologyLandingStubComponent;
    case ':technology/preguntas':
      return TechnologyQuestionsStubComponent;
    case ':technology/recursos':
      return TechnologyResourcesStubComponent;
    case 'guia/:technology':
      return TechnologyGuideStubComponent;
    case ':technology/tema/:tag':
      return TechnologyTopicStubComponent;
    case ':technology/nivel/:level':
      return TechnologyLevelStubComponent;
    case ':technology/:slug':
      return QuestionDetailStubComponent;
    default:
      return GenericStubComponent;
  }
}

const testRoutes: Routes = appRoutes.map((route) => {
  if (route.redirectTo) {
    return {
      path: route.path,
      redirectTo: route.redirectTo,
      pathMatch: route.pathMatch,
    };
  }

  return {
    path: route.path,
    component: componentForPath(route.path),
  };
});

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(testRoutes)],
    }).compileComponents();
  });

  it('routes /vue to the technology landing', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vue', TechnologyLandingStubComponent);
  });

  it('routes /vue/preguntas to the questions page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vue/preguntas', TechnologyQuestionsStubComponent);
  });

  it('routes /vue/recursos to the resources page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vue/recursos', TechnologyResourcesStubComponent);
  });

  it('routes /guia/vue to the guide page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/guia/vue', TechnologyGuideStubComponent);
  });

  it('routes /vue/tema/architecture to the topic page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vue/tema/architecture', TechnologyTopicStubComponent);
  });

  it('routes /vue/nivel/senior to the level page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vue/nivel/senior', TechnologyLevelStubComponent);
  });

  it('keeps question detail routing after the reserved subroutes', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/guia/vue', TechnologyGuideStubComponent);
    await harness.navigateByUrl('/vue/tema/architecture', TechnologyTopicStubComponent);
    await harness.navigateByUrl('/vue/nivel/senior', TechnologyLevelStubComponent);
    await harness.navigateByUrl('/vue/preguntas', TechnologyQuestionsStubComponent);
    await harness.navigateByUrl('/vue/recursos', TechnologyResourcesStubComponent);
    await harness.navigateByUrl('/vue/que-es-vue', QuestionDetailStubComponent);
  });
});
