import {BrowserTreeController} from './browser_tree';
import { DataCenter } from './datacenter';
import { EditorComponent } from './editor';
import { PracticeController } from './practice';

import * as localforage from 'localforage';

const dc = new DataCenter;

const editorComponent = new EditorComponent(dc);
editorComponent.update();

const practiceController = new PracticeController(editorComponent);

const browserTreeController = new BrowserTreeController(dc, editorComponent);

const emergency = false;
if (emergency) {
  localforage.clear();
}
dc.load(() => {
  browserTreeController.onBooting();
});