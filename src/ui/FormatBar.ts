import { CommandRegistry } from '../core/Commands';

export class FormatBar {
  private element: HTMLElement;
  private commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this.commands = commands;
    this.element = this.createBar();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private createBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'rye-format-bar';

    // 1. Satır Aralığı
    const lhGroup = this.createGroup('Satır Aralığı:', [
      { label: 'Tekli (1.0)', value: '1' },
      { label: '1.15 (Resmi Standart)', value: '1.15', selected: true },
      { label: '1.5', value: '1.5' },
      { label: 'Çift (2.0)', value: '2' },
      { label: '2.5', value: '2.5' }
    ], (val) => {
      this.commands.execute('lineHeight', val);
    });
    bar.appendChild(lhGroup);

    // 2. Paragraf Sonrası Boşluk (Yönetmelik 16. Madde: Paragraflar arasında satır boşluğu bırakılmaz)
    const psGroup = this.createGroup('Paragraf Sonrası Boşluk:', [
      { label: 'Yok (0pt - Resmi Standart)', value: '0pt', selected: true },
      { label: 'Az (6pt)', value: '6pt' },
      { label: 'Orta (12pt)', value: '12pt' },
      { label: 'Fazla (18pt)', value: '18pt' }
    ], (val) => {
      this.commands.execute('paragraphSpacing', val);
    });
    bar.appendChild(psGroup);

    // 3. İlk Satır Girintisi (Yönetmelik 16. Madde: Paragrafa 1,25 cm içeriden başlanır)
    const indentGroup = this.createGroup('İlk Satır Girintisi:', [
      { label: 'Yok', value: '' },
      { label: 'Standart (1.25 cm)', value: '1.25cm', selected: true },
      { label: 'Geniş (2.50 cm)', value: '2.5cm' }
    ], (val) => {
      this.commands.execute('firstLineIndent', val);
    });
    bar.appendChild(indentGroup);

    // 4. Kenar Boşluğu (Yönetmelik 8. Madde: Üst, sol ve sağ 1.5 cm; alt azami 0.5 cm)
    const marginGroup = this.createGroup('Sayfa Kenar Boşluğu:', [
      { label: 'Resmi Standart (1.5 cm / Alt 0.5 cm)', value: '1.5cm 1.5cm 0.5cm 1.5cm', selected: true },
      { label: '1.5 cm Eşit', value: '1.5cm' },
      { label: 'Eski Standart (2.5 cm)', value: '2.5cm' },
      { label: 'Geniş (3.0 cm)', value: '3cm' }
    ], (val) => {
      this.commands.execute('pageMargin', val);
    });
    bar.appendChild(marginGroup);

    return bar;
  }

  private createGroup(labelTxt: string, options: Array<{ label: string; value: string; selected?: boolean }>, onChange: (val: string) => void): HTMLElement {
    const group = document.createElement('div');
    group.className = 'rye-format-group';

    const label = document.createElement('label');
    label.innerText = labelTxt;
    group.appendChild(label);

    const select = document.createElement('select');
    select.className = 'rye-format-select';

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.innerText = opt.label;
      if (opt.selected) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      onChange(select.value);
    });

    group.appendChild(select);
    return group;
  }
}
