// ============================================================
// 🏫 Teacher Dashboard — Question Editor (Thai)
// ============================================================

import Phaser from 'phaser';
import { TH } from '../lang/th';
import { QuestionBank } from '../systems/QuestionBank';
import { SoundManager } from '../systems/SoundManager';
import { ClassType, CLASS_DEFINITIONS } from '../models/CharacterClass';
import { createQuestion } from '../models/Question';
import type { QuestionData } from '../models/Question';

const ALL_CLASSES = Object.values(ClassType);

export class TeacherDashboard extends Phaser.Scene {
  private questions: QuestionData[] = [];
  private listContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private formMode: 'add' | 'edit' = 'add';
  private editingId: number | null = null;
  private filterCategory: ClassType | 'all' = 'all';

  // Form fields
  private formContainer!: Phaser.GameObjects.Container;
  private formPrompt = '';
  private formChoices: string[] = ['', '', '', ''];
  private formCorrectIndex = 0;
  private formCategory: ClassType = ClassType.Warrior;
  private formDifficulty = 1;
  private formSkillId = '';

  constructor() {
    super({ key: 'TeacherDashboard' });
  }

  async create() {
    const { width, height } = this.cameras.main;
    this.scrollY = 0;
    this.filterCategory = 'all';
    this.formMode = 'add';
    this.editingId = null;

    SoundManager.init(this);
    this.add.image(width / 2, height / 2, 'bg_menu')
      .setDisplaySize(width, Math.max(height, width * 1025 / 1024))
      .setOrigin(0.5);

    // Title
    this.add.text(width / 2, 30, TH.teacher.title, {
      fontSize: '28px',
      color: '#4ecca3',
      fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(50, 30, TH.teacher.backToMenu, {
      fontSize: '18px', color: '#e74c3c', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Action buttons row
    const addBtn = this.createTextButton(width / 2 - 180, 70, TH.teacher.addQuestion, () => this.showForm('add'));
    const importBtn = this.createTextButton(width / 2 - 50, 70, TH.teacher.importQuestions, () => this.showImportDialog());
    const exportBtn = this.createTextButton(width / 2 + 80, 70, TH.teacher.exportQuestions, () => this.exportQuestions());
    const resetBtn = this.createTextButton(width / 2 + 200, 70, 'รีเซ็ตการใช้', () => this.resetUses());

    // Filter buttons
    const filterY = 105;
    const filterAll = this.createSmallButton(70, filterY, TH.teacher.allCategories, () => { this.filterCategory = 'all'; this.refreshList(); });
    ALL_CLASSES.forEach((cls, i) => {
      const key = `class_${cls}`;
      const label = (TH.classes as any)[cls] || cls;
      this.createSmallButton(70 + (i + 1) * 110, filterY, label, () => { this.filterCategory = cls; this.refreshList(); });
    });

    // List container (scrollable)
    this.listContainer = this.add.container(0, 0);

    // Form container (hidden by default)
    this.formContainer = this.add.container(0, 0).setVisible(false);

    await this.refreshList();
  }

  private async refreshList() {
    this.listContainer.removeAll(true);

    const allQuestions = await QuestionBank.getAll();
    this.questions = this.filterCategory === 'all'
      ? allQuestions
      : allQuestions.filter(q => q.category === this.filterCategory);

    const startY = 140;

    // Header
    const headers = ['ลำดับ', 'หมวดหมู่', 'ความยาก', 'คำถาม', 'คงเหลือ', 'จัดการ'];
    const colWidths = [50, 80, 70, 300, 60, 100];
    let hx = 30;
    headers.forEach((h, i) => {
      this.listContainer.add(
        this.add.text(hx, startY, h, {
          fontSize: '14px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
        })
      );
      hx += colWidths[i];
    });

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, 0x333333);
    sep.beginPath();
    sep.moveTo(20, startY + 22);
    sep.lineTo(780, startY + 22);
    sep.strokePath();
    this.listContainer.add(sep);

    if (this.questions.length === 0) {
      this.listContainer.add(
        this.add.text(400, startY + 50, TH.teacher.noQuestions, {
          fontSize: '16px', color: '#777777', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
        }).setOrigin(0.5)
      );
      return;
    }

    this.questions.forEach((q, i) => {
      const y = startY + 30 + i * 36;
      const catName = (TH.classes as any)[q.category] || q.category;
      const diffLabel = TH.teacher.difficultyLevels[q.difficulty - 1] || '';
      const status = q.usesRemaining > 0
        ? `${q.usesRemaining}`
        : TH.teacher.exhausted;
      const statusColor = q.usesRemaining > 0 ? '#4ecca3' : '#e74c3c';

      let qx = 30;
      this.listContainer.add(this.add.text(qx, y, `${i + 1}`, { fontSize: '13px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' })); qx += 50;
      this.listContainer.add(this.add.text(qx, y, catName, { fontSize: '13px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' })); qx += 80;
      this.listContainer.add(this.add.text(qx, y, diffLabel, { fontSize: '13px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' })); qx += 70;
      const promptDisplay = q.prompt.length > 35 ? q.prompt.substring(0, 35) + '...' : q.prompt;
      this.listContainer.add(this.add.text(qx, y, promptDisplay, { fontSize: '13px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' })); qx += 300;
      this.listContainer.add(this.add.text(qx, y, status, { fontSize: '13px', color: statusColor, fontFamily: 'Noto Sans Thai, Arial, sans-serif' })); qx += 60;

      // Edit button
      const editTxt = this.add.text(qx, y, '✏️', { fontSize: '16px' }).setInteractive({ useHandCursor: true });
      editTxt.on('pointerdown', () => this.editQuestion(q));
      this.listContainer.add(editTxt); qx += 30;

      // Delete button
      const delTxt = this.add.text(qx, y, '🗑️', { fontSize: '16px' }).setInteractive({ useHandCursor: true });
      delTxt.on('pointerdown', () => this.deleteQuestion(q));
      this.listContainer.add(delTxt);
    });
  }

  private async showForm(mode: 'add' | 'edit', question?: QuestionData) {
    this.formMode = mode;
    this.formContainer.removeAll(true);
    this.formContainer.setVisible(true);

    const { width } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, 300, 800, 600, 0x000000, 0.8).setInteractive();
    this.formContainer.add(overlay);

    // Form panel
    const panel = this.add.rectangle(width / 2, 280, 600, 500, 0x16213e).setStrokeStyle(2, 0x4ecca3);
    this.formContainer.add(panel);

    const title = this.add.text(width / 2, 100, mode === 'add' ? TH.teacher.addQuestion : TH.teacher.editQuestion, {
      fontSize: '24px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.formContainer.add(title);

    // Fields
    let fy = 140;

    // Prompt
    this.formContainer.add(this.add.text(120, fy, `${TH.teacher.prompt}:`, { fontSize: '14px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }));
    const promptBg = this.add.rectangle(450, fy + 12, 400, 30, 0x0a0a2e).setStrokeStyle(1, 0x666666);
    this.formContainer.add(promptBg);
    const promptText = this.add.text(260, fy + 2, question?.prompt || '', { fontSize: '14px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' });
    this.formContainer.add(promptText);
    const promptInput = this.createTextInput(promptBg, promptText, (val) => { this.formPrompt = val; });
    fy += 40;

    // Choices (4)
    for (let i = 0; i < 4; i++) {
      const label = `${TH.teacher.choice} ${i + 1}:`;
      this.formContainer.add(this.add.text(120, fy, label, { fontSize: '14px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }));
      const choiceBg = this.add.rectangle(450, fy + 12, 400, 30, 0x0a0a2e).setStrokeStyle(1, 0x666666);
      this.formContainer.add(choiceBg);
      const choiceText = this.add.text(260, fy + 2, question?.choices[i] || '', { fontSize: '14px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' });
      this.formContainer.add(choiceText);
      const input = this.createTextInput(choiceBg, choiceText, (val) => { this.formChoices[i] = val; });
      this.formContainer.add(choiceBg);
      this.formContainer.add(choiceText);

      // Correct answer radio
      if (question) {
        const isCorrect = question.correctIndex === i;
        const radioLabel = isCorrect ? '✓' : '○';
        const radio = this.add.text(90, fy - 8, radioLabel, {
          fontSize: '18px', color: isCorrect ? '#4ecca3' : '#666666',
        }).setInteractive({ useHandCursor: true });
        radio.on('pointerdown', () => {
          this.formCorrectIndex = i;
          this.formContainer.destroy();
          this.showForm('edit', { ...question, correctIndex: i });
        });
        this.formContainer.add(radio);
      }
      fy += 35;
    }

    // Category dropdown
    fy += 5;
    this.formContainer.add(this.add.text(120, fy, `${TH.teacher.category}:`, { fontSize: '14px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }));
    const catBg = this.add.rectangle(300, fy + 12, 180, 30, 0x0a0a2e).setStrokeStyle(1, 0x666666);
    this.formContainer.add(catBg);
    const currentCat = question?.category || ClassType.Warrior;
    const catText = this.add.text(300, fy + 2, (TH.classes as any)[currentCat] || currentCat, { fontSize: '14px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);
    this.formContainer.add(catText);
    catBg.setInteractive({ useHandCursor: true });
    catBg.on('pointerdown', () => {
      // Cycle through categories
      const clsArray = Object.values(ClassType);
      const idx = clsArray.indexOf(this.formCategory);
      const next = clsArray[(idx + 1) % clsArray.length];
      this.formCategory = next;
      catText.setText((TH.classes as any)[next] || next);
    });
    fy += 35;

    // Difficulty
    this.formContainer.add(this.add.text(120, fy, `${TH.teacher.difficulty} (${question?.difficulty || 1}/5):`, { fontSize: '14px', color: '#cccccc', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }));
    const diffBg = this.add.rectangle(300, fy + 12, 180, 30, 0x0a0a2e).setStrokeStyle(1, 0x666666);
    this.formContainer.add(diffBg);
    const diffVal = question?.difficulty || 1;
    const diffText = this.add.text(300, fy + 2, TH.teacher.difficultyLevels[diffVal - 1], { fontSize: '14px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);
    this.formContainer.add(diffText);
    diffBg.setInteractive({ useHandCursor: true });
    diffBg.on('pointerdown', () => {
      this.formDifficulty = (this.formDifficulty % 5) + 1;
      diffText.setText(TH.teacher.difficultyLevels[this.formDifficulty - 1]);
    });
    fy += 40;

    // Save & Cancel buttons
    const saveBg = this.add.image(width / 2 - 70, fy + 20, 'btn_green_sm').setInteractive({ useHandCursor: true });
    const saveText = this.add.text(width / 2 - 70, fy + 20, TH.teacher.save, { fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);
    this.formContainer.add(saveBg);
    this.formContainer.add(saveText);

    const cancelBg = this.add.image(width / 2 + 70, fy + 20, 'btn_red_sm').setInteractive({ useHandCursor: true });
    const cancelText = this.add.text(width / 2 + 70, fy + 20, TH.teacher.cancel, { fontSize: '18px', color: '#ffffff', fontFamily: 'Noto Sans Thai, Arial, sans-serif' }).setOrigin(0.5);
    this.formContainer.add(cancelBg);
    this.formContainer.add(cancelText);

    saveBg.on('pointerdown', async () => {
      const q = createQuestion(
        this.formPrompt || question?.prompt || '',
        this.formChoices.every(c => c) ? this.formChoices : (question?.choices || ['', '', '', '']),
        this.formCorrectIndex,
        this.formCategory,
        this.formDifficulty,
        this.formSkillId,
      );

      if (mode === 'add') {
        await QuestionBank.add(q);
      } else if (question?.id !== undefined) {
        await QuestionBank.update(question.id, q);
      }

      this.formContainer.setVisible(false);
      await this.refreshList();
    });

    cancelBg.on('pointerdown', () => {
      this.formContainer.setVisible(false);
    });
  }

  private async editQuestion(q: QuestionData) {
    this.formPrompt = q.prompt;
    this.formChoices = [...q.choices];
    this.formCorrectIndex = q.correctIndex;
    this.formCategory = q.category;
    this.formDifficulty = q.difficulty;
    this.formSkillId = q.assignedSkillId;
    this.showForm('edit', q);
  }

  private async deleteQuestion(q: QuestionData) {
    // Simple confirm
    if (q.id !== undefined) {
      await QuestionBank.delete(q.id);
      await this.refreshList();
    }
  }

  private async exportQuestions() {
    const json = await QuestionBank.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private async resetUses() {
    await QuestionBank.resetAllUses();
    await this.refreshList();
  }

  private showImportDialog() {
    // Create a DOM textarea for pasting JSON
    const existing = document.getElementById('teacher-import-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'teacher-import-overlay';
    overlay.style.cssText = `
      position: fixed; z-index: 10000; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
      align-items: center; justify-content: center;
    `;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'วาง JSON คำถามที่นี่...';
    textarea.style.cssText = `
      width: 500px; height: 300px; padding: 12px; font-size: 14px;
      font-family: monospace; background: #0a0a2e; color: #ffffff;
      border: 2px solid #4ecca3; border-radius: 6px; outline: none;
      resize: vertical;
    `;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 12px; margin-top: 12px;';

    const importBtn = document.createElement('button');
    importBtn.textContent = TH.teacher.importQuestions;
    importBtn.style.cssText = `
      padding: 10px 24px; font-size: 16px; font-family: 'Noto Sans Thai', Arial, sans-serif;
      background: #4ecca3; color: #000; border: none; border-radius: 6px; cursor: pointer;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = TH.teacher.cancel;
    cancelBtn.style.cssText = `
      padding: 10px 24px; font-size: 16px; font-family: 'Noto Sans Thai', Arial, sans-serif;
      background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer;
    `;

    importBtn.addEventListener('click', async () => {
      try {
        const questions = JSON.parse(textarea.value) as QuestionData[];
        if (questions.length > 0) {
          await QuestionBank.bulkAdd(questions);
          overlay.remove();
          this.refreshList();
        }
      } catch {
        alert('JSON ไม่ถูกต้อง');
      }
    });

    cancelBtn.addEventListener('click', () => overlay.remove());

    btnRow.appendChild(importBtn);
    btnRow.appendChild(cancelBtn);
    overlay.appendChild(textarea);
    overlay.appendChild(btnRow);
    document.body.appendChild(overlay);
  }

  private createTextButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, text, {
      fontSize: '14px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
      backgroundColor: '#16213e', padding: { x: 8, y: 4 },
    }).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    return btn;
  }

  private createSmallButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.text(x, y, `[${text}]`, {
      fontSize: '12px', color: '#4ecca3', fontFamily: 'Noto Sans Thai, Arial, sans-serif',
    }).setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    return this.add.container(0, 0).add(bg);
  }

  private createTextInput(
    bg: Phaser.GameObjects.Rectangle,
    textObj: Phaser.GameObjects.Text,
    onChange: (val: string) => void,
  ): void {
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      // Create a DOM input element over the canvas
      const existingInput = document.getElementById('teacher-input-overlay');
      if (existingInput) existingInput.remove();

      const input = document.createElement('input');
      input.id = 'teacher-input-overlay';
      input.type = 'text';
      input.value = textObj.text;
      input.style.cssText = `
        position: fixed; z-index: 10000; padding: 8px 12px;
        font-size: 16px; font-family: 'Noto Sans Thai', Arial, sans-serif;
        border: 2px solid #4ecca3; background: #0a0a2e; color: #ffffff;
        border-radius: 6px; outline: none; width: 400px;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
      `;

      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const val = input.value;
          textObj.setText(val);
          onChange(val);
          input.remove();
        }
        if (e.key === 'Escape') {
          input.remove();
        }
      });

      // Also a confirm button
      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = TH.teacher.confirm;
      confirmBtn.style.cssText = `
        position: fixed; z-index: 10000; padding: 8px 20px;
        font-size: 16px; font-family: 'Noto Sans Thai', Arial, sans-serif;
        background: #4ecca3; color: #000; border: none; border-radius: 6px;
        cursor: pointer; top: calc(50% + 40px); left: 50%; transform: translateX(-50%);
      `;

      document.body.appendChild(input);
      document.body.appendChild(confirmBtn);
      input.focus();
      input.select();

      confirmBtn.addEventListener('click', () => {
        const val = input.value;
        textObj.setText(val);
        onChange(val);
        input.remove();
        confirmBtn.remove();
      });
    });
  }
}
