import chalk from 'chalk';
import inputController from '../InputController';
import { EventEmitter } from 'events';

import MenuOption, { IMenuOptions } from './MenuOptions';

interface ICLIMenuOptions {
  title?: string,
  options?: IMenuOptions[],
  parent?: CLIMenu
}

export default class CLIMenu extends EventEmitter {
  public width = process.stdout.columns;
  public height = process.stdout.rows;
  public title: string;
  public options: MenuOption[];
  public parent?: CLIMenu;
  public maxTextWidth: number;
  public selectedOption: number = 0;
  constructor (settings: ICLIMenuOptions = {}) {
    super();
    this.title = settings.title || '';
    this.parent = settings.parent;
    this.options = (settings.options || []).map(opt => new MenuOption(opt, this));

    this.maxTextWidth = Math.max(...(settings.options || []).map(option => option.name).concat(settings.title || '').map((str => this.calculateTextSize(str).width)));
  }
  init () {
    const self = this;
    function onKeyPress (name: string) {
      if (name === 'down' || name === 'up') {
        const newIndex = self.selectedOption + (name === 'up' ? -1 : 1);
        if (self.options[newIndex]) {
          self.selectedOption = newIndex;
          self.print();
        }
      } else if (name === 'return') {
        const selected = self.options[self.selectedOption];
        if (selected.callback) {
          selected.callback();
        }
      }
    }
    inputController.on('keypress', onKeyPress);
    this.on('destroy', () => {
      inputController.off('keypress', onKeyPress);
    });
    this.print();
  }
  destroy () {
    console.clear();
    this.emit('destroy');
  }
  calculateTextSize (text: string) {
    const rows = text.split('\n');
    return {
      width: Math.max(...rows.map(s => s.length)),
      height: rows.length
    }
  }
  center (text: string, modifyText: (text: string) => string = (val: string) => val, modifyMargin: number = 0) {
    const maxWidth = this.calculateTextSize(text).width;
    const padding = ' '.repeat(Math.floor((this.width - maxWidth) / 2));
    return text.split('\n').map(s => {
      const marginedStartPadding = padding.slice(0, padding.length - modifyMargin);
      const str = ' '.repeat(modifyMargin) + s + ' '.repeat(modifyMargin);
      return `${marginedStartPadding}${modifyText(str)}`
    }).join('\n');
  }
  print () {
    const height = this.title.split('\n').length + this.options.reduce((prev, now) => prev + now.name.split('\n').length, 0) + 4;
    console.clear();
    console.log('\n'.repeat(Math.floor(this.height - height) / 4));
    console.log(this.center(this.title, chalk.green));
    console.log('\n\n');
    for (let index = 0; index < this.options.length; index++) {
      const option = this.options[index];
      let title: string;
      const margin = Math.floor((this.maxTextWidth - option.name.length) / 2);
      if (index === this.selectedOption) {
        title = this.center(option.name, txt => chalk.bgGreen(chalk.black(txt)), margin);
      } else {
        title = this.center(option.name, txt => chalk.green(txt), margin);
      }
      console.log(title);
    }
  }
  hide () {
    console.clear();
  }
}