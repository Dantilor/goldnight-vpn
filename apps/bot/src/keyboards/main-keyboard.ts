import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.js';

export function createMainKeyboard(miniAppUrl: string) {
  return Markup.keyboard([
    [Markup.button.webApp(BUTTONS.openApp, miniAppUrl)],
    [BUTTONS.mySubscription, BUTTONS.setupVpn],
    [BUTTONS.referrals, BUTTONS.help]
  ]).resize();
}
