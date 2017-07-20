const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;
const Util = imports.misc.util;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Timer = Self.imports.timer;

const HistoryElement = new Lang.Class({
	Name: 'HistoryElement',
	Extends: PopupMenu.PopupSubMenuMenuItem,
	historyEntry: null,

	_init: function (historyEntry, index) {
		this.parent("", false);

		let timestamp = historyEntry.timestamp;
		let date = new Date(timestamp);

		let timeString = date.toLocaleTimeString();
		let dateString = date.toLocaleDateString();

		let prefixText;
		if (index === 0) {
			prefixtext = "Current Background";
		} else {
			prefixtext = String(index) + '.';
		}
		this.prefixLabel = new St.Label({
			text: prefixtext,
			style_class: 'rwg-history-index'
		});

		this.actor.insert_child_above(this.prefixLabel, this.label);
		this.label.destroy();

		this._container = new St.BoxLayout({
			vertical: true
		});

		this.dateLabel = new St.Label({
			text: dateString,
			style_class: 'rwg-history-date'
		});
		this._container.add_child(this.dateLabel);

		this.timeLabel = new St.Label({
			text: timeString,
			style_class: 'rwg-history-time'
		});
		this._container.add_child(this.timeLabel);

		this.historyEntry = historyEntry;
		this.actor.historyId = historyEntry.id; // extend the actor with the historyId

		if (index !== 0) {
			this.actor.insert_child_above(this._container, this.prefixLabel);
		}

		if (this.historyEntry.source && this.historyEntry.source !== null) {

			if (this.historyEntry.source.author !== null
				&& this.historyEntry.source.authorUrl !== null) {
				this.authorItem = new PopupMenu.PopupMenuItem('Image By: ' + this.historyEntry.source.author);
				this.authorItem.connect('activate', () => {
					Util.spawn(['xdg-open', this.historyEntry.source.authorUrl]);
				});

				this.menu.addMenuItem(this.authorItem);
			}

			if (this.historyEntry.source.source !== null
				&& this.historyEntry.source.sourceUrl !== null) {
				this.sourceItem = new PopupMenu.PopupMenuItem('Image From: ' + this.historyEntry.source.source);
				this.sourceItem.connect('activate', () => {
					Util.spawn(['xdg-open', this.historyEntry.source.sourceUrl]);
				});

				this.menu.addMenuItem(this.sourceItem);
			}

			this.imageUrlItem = new PopupMenu.PopupMenuItem('Open Image In Browser');
			this.imageUrlItem.connect('activate', () => {
				Util.spawn(['xdg-open', this.historyEntry.source.imageUrl]);
			});

			this.menu.addMenuItem(this.imageUrlItem);

		} else {
			this.menu.addMenuItem(new PopupMenu.PopupMenuItem('Unknown source.'));
		}

	}
});

const CurrentImageElement = new Lang.Class({
	Name: 'CurrentImageElement',
	Extends: HistoryElement,

	_init: function(historyElement) {
		this.parent(historyElement, 0);
	}
});

/**
 * Element for the New Wallpaper button and the remaining time for the auto fetch
 * feature.
 * The remaining time will only be displayed if the af-feature is activated.
 *
 * @type {Lang.Class}
 */
const NewWallpaperElement = new Lang.Class({
	Name: 'NewWallpaperElement',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function (params) {
		this.parent(params);

		this._timer = new Timer.AFTimer();

		this._container = new St.BoxLayout({
			vertical: true
		});

		this._newWPLabel = new St.Label({
			text: 'New Wallpaper',
			style_class: 'rwg-new-lable'
		});
		this._container.add_child(this._newWPLabel);

		this._remainingLabel = new St.Label({
			text: '1 minute remaining'
		});
		this._container.add_child(this._remainingLabel);

		this.actor.add_child(this._container);
	},

	show: function () {
		if (this._timer.isActive()) {
			let remainingMinutes = this._timer.remainingMinutes();
			let minutes = remainingMinutes % 60;
			let hours = Math.floor(remainingMinutes / 60);

			let hoursText = hours.toString();
			hoursText += (hours == 1) ? ' hour' : ' hours';
			let minText = minutes.toString();
			minText += (minutes == 1) ? ' minute' : ' minutes';

			if (hours >= 1) {
				this._remainingLabel.text = '... ' + hoursText + ' and ' + minText + ' remaining.'
			} else {
				this._remainingLabel.text = '... ' + minText + ' remaining.'
			}

			this._remainingLabel.show();
		} else {
			this._remainingLabel.hide();
		}
	}
});

const StatusElement = new Lang.Class({
	Name: 'StatusElement',
	Extends: St.Icon,

	_init: function () {

		this.parent({
			icon_name: 'preferences-desktop-wallpaper-symbolic',
			style_class: 'system-status-icon'
		});

		let _this = this;

		this.loadingTweenIn = {
			opacity: 20,
			time: 1,
			transition: 'easeInOutSine',
			onComplete: function () {
				Tweener.addTween(_this, _this.loadingTweenOut);
			}
		};

		this.loadingTweenOut = {
			opacity: 255,
			time: 1,
			transition: 'easeInOutSine',
			onComplete: function () {
				if (_this.isLoading) {
					Tweener.addTween(_this, _this.loadingTweenIn);
				} else {
					return false;
				}
				return true;
			}
		}

	},

	startLoading: function () {
		this.isLoading = true;
		Tweener.addTween(this, this.loadingTweenOut);
	},

	stopLoading: function () {
		this.isLoading = false;
		Tweener.removeTweens(this);
		this.opacity = 255;
	}

});