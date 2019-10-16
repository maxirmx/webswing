import WebswingDirectDraw from './webswing-dd';
import Util from './webswing-util';
import $ from 'jquery';

export default class BaseModule {
	constructor() {
        let module = this;
        let api;
        module.injects = api = {
        	external: 'external',
            cfg : 'webswing.config',
            disconnect : 'webswing.disconnect',
            fireCallBack : 'webswing.fireCallBack',
            getSocketId : 'socket.uuid',
            send: 'socket.send',
            getCanvas : 'canvas.get',
            getInput: 'canvas.getInput',
            getDesktopSize: 'canvas.getDesktopSize',
            translateBrowserPoint: 'canvas.translateBrowserPoint',
            translateDesktopPoint: 'canvas.translateDesktopPoint',
            registerInput : 'input.register',
            sendInput : 'input.sendInput',
            disposeInput : 'input.dispose',
            registerTouch : 'touch.register',
            disposeTouch : 'touch.dispose',
            getUser : 'login.user',
            login : 'login.login',
            getIdentity : 'identity.get',
            disposeIdentity : 'identity.dispose',
            getLocale : 'identity.getLocale',
            showDialog : 'dialog.show',
            hideDialog : 'dialog.hide',
            startingDialog : 'dialog.content.startingDialog',
            stoppedDialog : 'dialog.content.stoppedDialog',
            applicationAlreadyRunning : 'dialog.content.applicationAlreadyRunning',
            sessionStolenNotification : 'dialog.content.sessionStolenNotification',
            tooManyClientsNotification : 'dialog.content.tooManyClientsNotification',
            continueOldSessionDialog : 'dialog.content.continueOldSessionDialog',
            showSelector : 'selector.show',
            openFileDialog : 'files.open',
            closeFileDialog : 'files.close',
            openLink : 'files.link',
            print : 'files.print',
            download : 'files.download',
            displayCopyBar : 'clipboard.displayCopyBar',
            processJsLink : 'jslink.process',
            playbackInfo : 'playback.playbackInfo',
            performAction: 'base.performAction',
            handleActionEvent: 'base.handleActionEvent'
        };
        module.provides = {
            startApplication : startApplication,
            startMirrorView : startMirrorView,
            continueSession : continueSession,
            kill : kill,
            handshake : handshake,
            processMessage : processMessage,
            dispose : dispose,
            getWindows: getWindows,
            getWindowById: getWindowById,
            performAction: performAction,
            handleActionEvent: handleActionEvent
        };

        let timer1, timer2, timer3;
        let drawingLock;
        let drawingQ = [];

        let windowImageHolders = {}; // <id> : <CanvasWindow/HtmlWindow>
        let directDraw = new WebswingDirectDraw({logDebug:api.cfg.debugLog, ieVersion:api.cfg.ieVersion, dpr: Util.dpr});
        var compositingWM = false;
        var compositionBaseZIndex = 100;
        
        function startApplication(name, applet, alwaysReset) {
            if (alwaysReset===true){
                api.disposeIdentity();
            }
            initialize(api.getUser() + api.getIdentity() + name, name, applet, false);
        }

        function startMirrorView(clientId, appName) {
            initialize(clientId, appName, null, true)
        }

        function initialize(clientId, name, applet, isMirror) {
            api.registerInput();
            api.registerTouch();
            window.addEventListener('beforeunload', beforeUnloadEventHandler);
            resetState();
            api.cfg.clientId = clientId;
            api.cfg.appName = name;
            api.cfg.canPaint = true;
            api.cfg.hasControl = !isMirror;
            api.cfg.mirrorMode = isMirror;
            api.cfg.applet = applet != null ? applet : api.cfg.applet;
            handshake();
            if (isMirror) {
                repaint();
            }
            //api.showDialog(api.startingDialog);
            api.fireCallBack({type: 'webswingInitialied'});
        }

        function beforeUnloadEventHandler(evt) {
            dispose();
        }

        function continueSession() {
            api.hideDialog();
            api.cfg.canPaint = true;
            handshake();
            repaint();
            ack();
            api.fireCallBack({type: 'continueSession'});
        }

        function resetState() {
            api.cfg.clientId = '';
            api.cfg.viewId = Util.GUID();
            api.cfg.appName = null;
            api.cfg.hasControl = false;
            api.cfg.mirrorMode = false;
            api.cfg.canPaint = false;
            clearInterval(timer1);
            clearInterval(timer2);
            clearInterval(timer3);
            timer1 = setInterval(api.sendInput, 100);
            timer2 = setInterval(heartbeat, 10000);
            timer3 = setInterval(servletHeartbeat, 100000);
            windowImageHolders = {};
            directDraw.dispose();
            directDraw = new WebswingDirectDraw({logDebug:api.cfg.debugLog, ieVersion:api.cfg.ieVersion, dpr: Util.dpr});
        }

        function sendMessageEvent(message) {
            api.sendInput({
                event : {
                    type : message
                }
            });
        }

        function heartbeat() {
            sendMessageEvent('hb');
        }

        function servletHeartbeat() {
            //touch servlet session to avoid timeout
            api.login(function(){},function(){});
        }

        function repaint() {
            sendMessageEvent('repaint');
        }

        function ack() {
            sendMessageEvent('paintAck');
        }

        function kill() {
            if (api.cfg.hasControl) {
                sendMessageEvent('killSwing');
            }
        }

        function unload() {
            if(!api.cfg.mirrorMode){
                sendMessageEvent('unload');
            }
        }

        function handshake(continueOldSession) {
            api.sendInput(getHandShake(api.getCanvas(), continueOldSession));
        }

        function dispose() {
            clearInterval(timer1);
            clearInterval(timer2);
            clearInterval(timer3);
            unload();
            api.sendInput();
            drawingQ.length = 0
            drawingQ = null;
            drawingLock = null;
            api.cfg.clientId = null;
            api.cfg.viewId = null;
            api.cfg.appName = null;
            api.cfg.hasControl = false;
            api.cfg.mirrorMode = false;
            api.cfg.canPaint = false;
            for (let key in windowImageHolders) {
              if (windowImageHolders.hasOwnProperty(key)) {
                windowImageHolders[key] = null;
              }
            }
            windowImageHolders = null;
            api.disposeInput();
            api.disposeTouch();
            window.removeEventListener('beforeunload', beforeUnloadEventHandler);
            directDraw.dispose();
            directDraw = null;
            api.fireCallBack({type: 'webswingDispose'});
        }

        function processMessage(data) {
            if(data.javaResponse && data.javaResponse.value && data.javaResponse.value.javaObject &&  data.javaResponse.value.javaObject.id != null){
                api.fireCallBack({type: "deleteIdforTitle"});
            }
            if (data.playback != null) {
                api.playbackInfo(data);
            }
            if (data.applications != null && data.applications.length != 0) {
                api.showSelector(data.applications);
            }
            if (data.event != null && !api.cfg.recordingPlayback) {
                if (data.event == "shutDownNotification") {
                    api.fireCallBack({type: 'clientShutDown'});
                    api.showDialog(api.stoppedDialog);
                    api.disconnect();
                } else if (data.event == "applicationAlreadyRunning") {
                    api.showDialog(api.applicationAlreadyRunning);
                }
                else if (data.event == "tooManyClientsNotification") {
                    api.showDialog(api.tooManyClientsNotification);
                } else if (data.event == "continueOldSession") {
                    api.cfg.canPaint = false;
                    api.showDialog(api.continueOldSessionDialog);
                } else if (data.event == "continueOldSessionAutomatic") {
                    api.fireCallBack({type: "deleteIdforTitle"});
                    continueSession();
                } else if (data.event == "sessionStolenNotification") {
                    api.fireCallBack({type: 'stopSession'});
                    api.cfg.canPaint = false;
                    if (document.visibilityState === 'visible') {
                        api.showDialog(api.sessionStolenNotification);
                    }
                }
                return;
            }
            if (data.jsRequest != null && api.cfg.mirrorMode == false && !api.cfg.recordingPlayback) {
                api.processJsLink(data.jsRequest);
                return;
            }
            if (api.cfg.canPaint) {
                queuePaintingRequest(data);
            }
        }

        function queuePaintingRequest(data) {
            drawingQ.push(data);
            if (!drawingLock) {
                processNextQueuedFrame();
            }
        }

        function processNextQueuedFrame() {
            drawingLock = null;
            if (drawingQ.length > 0) {
                drawingLock = drawingQ.shift();
                try {
                    processRequest(drawingLock);
                } catch (error) {
                    drawingLock = null;
                    throw error;
                }
            }
        }

        function processRequest(data) {
        	var windowsData = null;
        	if (data.windows != null && data.windows.length > 0) {
        		windowsData = data.windows;
        	}
        	if (data.compositingWM && !compositingWM) {
        		compositingWM = true;
        		api.cfg.rootElement.addClass("composition");
        		$(api.getCanvas()).css({"width": "0px", "height": "0px", "position": "absolute", "top" : "0", "left": "0"});
        	}
        	        	
        	if (windowsData != null) {
        		api.hideDialog();
        	}
        	
            if (data.linkAction != null && !api.cfg.recordingPlayback) {
                if (data.linkAction.action == 'url') {
                    api.openLink(data.linkAction.src);
                } else if (data.linkAction.action == 'print') {
                    api.print(encodeURIComponent(location.pathname + 'file?id=' + data.linkAction.src));
                } else if (data.linkAction.action == 'file') {
                    api.download('file?id=' + data.linkAction.src);
                }
            }
            if (data.moveAction != null) {
            	// this applies only to non-CWM 
            	copy(data.moveAction.sx, data.moveAction.sy, data.moveAction.dx, data.moveAction.dy, data.moveAction.width, data.moveAction.height, api.getCanvas().getContext("2d"));
            }
            if (data.focusEvent != null) {
                let input=api.getInput();
                if(data.focusEvent.type === 'focusWithCarretGained'){
                    input.type = 'text';
                    input.style.top = (data.focusEvent.y+data.focusEvent.caretY)+'px';
                    input.style.left = (data.focusEvent.x+data.focusEvent.caretX)+'px';
                    input.style.height = data.focusEvent.caretH+'px';
                } else if(data.focusEvent.type === 'focusPasswordGained'){
                    input.type = 'password';
                    input.style.top = (data.focusEvent.y + data.focusEvent.caretY) + 'px';
                    input.style.left = (data.focusEvent.x + data.focusEvent.caretX) + 'px';
                    input.style.height = data.focusEvent.caretH + 'px';
                    input.focus({preventScroll: true});
                } else {
                    input.style.top = null;
                    input.style.left = null;
                    input.style.height = null;
                }
            }
            if (data.cursorChange != null && api.cfg.hasControl && !api.cfg.recordingPlayback) {
            	$("canvas.webswing-canvas").each(function(i, canvas) {
            		canvas.style.cursor = getCursorStyle(data.cursorChange);
            	});
            }
            if (data.copyEvent != null && api.cfg.hasControl && !api.cfg.recordingPlayback) {
                api.displayCopyBar(data.copyEvent);
            }
            if (data.fileDialogEvent != null && api.cfg.hasControl && !api.cfg.recordingPlayback) {
                if (data.fileDialogEvent.eventType === 'Open') {
                    api.openFileDialog(data.fileDialogEvent, api.cfg.clientId);
                } else if (data.fileDialogEvent.eventType === 'Close') {
                    api.closeFileDialog();
                }
            }
            if (data.closedWindow != null) {
            	var canvasWindow = windowImageHolders[data.closedWindow.id];
            		            	
            	if (canvasWindow) {
            		if (compositingWM) {
            			windowClosing(canvasWindow);
            			try {
            				canvasWindow.windowClosing();
            			} catch (e) {
            				console.error(e);
            			}
            		}
            		
            		$(canvasWindow.element).remove();
            		delete windowImageHolders[data.closedWindow.id];
            	            		
            		if (compositingWM) {
            			windowClosed(canvasWindow);
            			try {
            				canvasWindow.windowClosed();
            			} catch (e) {
            				console.error(e);
            			}
            		}
            	}
            }
            if (data.actionEvent != null && api.cfg.hasControl && !api.recordingPlayback) {
            	try {
            		if (data.actionEvent.windowId && windowImageHolders[data.actionEvent.windowId]) {
            			windowImageHolders[data.actionEvent.windowId].handleActionEvent(data.actionEvent.actionName, data.actionEvent.data, data.actionEvent.binaryData);
            		} else {
            			api.handleActionEvent(data.actionEvent.actionName, data.actionEvent.data, data.actionEvent.binaryData);
            		}
    			} catch (e) {
    				console.error(e);
    			}
            }
            
            // regular windows (background removed)
            if (windowsData != null) {
            	// first is always the background
                for ( let i in data.windows) {
                    let win = data.windows[i];
                    if (win.id == 'BG') {
                        if (api.cfg.mirrorMode || api.cfg.recordingPlayback) {
                            adjustCanvasSize(canvas, win.width, win.height);
                        }
                        for ( let x in win.content) {
                            let winContent = win.content[x];
                            if (winContent != null) {
                                clear(win.posX + winContent.positionX, win.posY + winContent.positionY, winContent.width, winContent.height, api.getCanvas().getContext("2d"));
                            }
                        }
                        data.windows.splice(i, 1);
                        break;
                    }
                }

                // regular windows (background removed)
                windowsData.reduce(function (sequence, window, index) {
                	return sequence.then(function () {
                		return renderWindow(window, compositingWM ? windowsData.length - index - 1 : index, data.directDraw);
                	}, errorHandler);
                }, Promise.resolve()).then(function () {
                	ack(data);
                	processNextQueuedFrame();
                }, errorHandler);
            } else {
                processNextQueuedFrame();
            }
        }
        
        function renderWindow(win, index, directDraw) {
        	if (directDraw) {
        		if (compositingWM) {
        			return renderDirectDrawComposedWindow(win, index);
        		}
        		return renderDirectDrawWindow(win, api.getCanvas().getContext("2d"));
        	} else {
        		if (compositingWM) {
        			return renderPngDrawComposedWindow(win, index);
        		}
        		return renderPngDrawWindow(win, api.getCanvas().getContext("2d"));
        	}
        }
 
        function renderPngDrawWindow(win, context) {
            return renderPngDrawWindowInternal(win, context);
        }
        
        function renderPngDrawComposedWindow(win, index) {
        	if (win.html) {
        		var newWindowOpened = false;
        		
        		if (windowImageHolders[win.id] == null) {
        			var htmlDiv = document.createElement("div");
        			htmlDiv.classList.add("webswing-html-canvas");
        			
        			windowImageHolders[win.id] = new HtmlWindow(win.id, htmlDiv, win.name, win.title);
        			newWindowOpened = true;
        			$(htmlDiv).attr('data-id', win.id).css("position", "absolute");

        			windowOpening(windowImageHolders[win.id]);
        			api.cfg.rootElement.append(htmlDiv);
        		}
        		
        		var htmlDiv = windowImageHolders[win.id].element;
        		
        		$(htmlDiv).css({"z-index": (compositionBaseZIndex + index + 1), "width": win.width + 'px', "height": win.height + 'px'});
        		if ($(htmlDiv).is(".modal-blocked") != win.modalBlocked) {
        			$(htmlDiv).toggleClass("modal-blocked", win.modalBlocked);
        			windowModalBlockedChanged(windowImageHolders[win.id]);
        		}
        		if (isVisible(htmlDiv.parentNode)) {
        			var p = api.translateDesktopPoint(win.posX, win.posY, htmlDiv.parentNode);
        			$(htmlDiv).css({"left": p.x + 'px', "top": p.y + 'px'});
        		}
        		
        		if (newWindowOpened) {
        			windowOpened(windowImageHolders[win.id]);
        			performActionInternal({ actionName: "", eventType: "init", data: "", binaryData: null, windowId: win.id });
        		}
        		
        		return Promise.resolve();
        	} else {
        		var newWindowOpened = false;
        		
        		if (windowImageHolders[win.id] == null) {
        			var canvas = document.createElement("canvas");
        			canvas.classList.add("webswing-canvas");
        			
        			windowImageHolders[win.id] = new CanvasWindow(win.id, canvas, win.name, win.title);
        			newWindowOpened = true;
        			$(canvas).attr('data-id', win.id).css("position", "absolute");
        			
        			windowOpening(windowImageHolders[win.id]);
        			api.cfg.rootElement.append(canvas);
        		}
        		
        		var canvas = windowImageHolders[win.id].element;
        		
        		if ($(canvas).width() != win.width || $(canvas).height() != win.height) {
        			$(canvas).css({"width": win.width + 'px', "height": win.height + 'px'});
        			$(canvas).attr("width", win.width).attr("height", win.height);
        		}
        		
        		var p = api.translateDesktopPoint(win.posX, win.posY, canvas.parentNode);
        		$(canvas).css({"left": p.x + 'px', "top": p.y + 'px'});
        		// update z-order
        		$(canvas).css({"z-index": (compositionBaseZIndex + index + 1)});
        		if ($(canvas).is(".modal-blocked") != win.modalBlocked) {
        			$(canvas).toggleClass("modal-blocked", win.modalBlocked);
        			windowModalBlockedChanged(windowImageHolders[win.id]);
        		}
        		
        		if (newWindowOpened) {
        			windowOpened(windowImageHolders[win.id]);
        			performActionInternal({ actionName: "", eventType: "init", data: "", binaryData: null, windowId: win.id });
        		}
        		
                return renderPngDrawWindowInternal(win, canvas.getContext("2d"));
        	}
        }
        
        function renderPngDrawWindowInternal(win, context) {
        	if (!win.content) {
        		return Promise.resolve();
        	}
        	
        	let decodedImages = [];
            return win.content.reduce(function(sequence, winContent) {
                return sequence.then(function(decodedImages) {
                    return new Promise(function(resolved, rejected) {
                        if (winContent != null) {
                            let imageObj = new Image();
                            let ieTimeoutId = null;
                            let onloadFunction = function() {       
                                if (ieTimeoutId) {
                                    window.clearTimeout(ieTimeoutId);
                                }                        
                                decodedImages.push({image:imageObj,winContent:winContent})
                                resolved(decodedImages);
 
                            };
                            imageObj.onload = function() {
                                // fix for ie - onload is fired before the image is ready for rendering to canvas.
                                // This is an ugly quickfix
                                if (api.cfg.ieVersion && api.cfg.ieVersion <= 10) {
                                    ieTimeoutId = window.setTimeout(onloadFunction, 20);
                                } else {
                                    onloadFunction();
                                }
                            };
                            imageObj.src = Util.getImageString(winContent.base64Content);
                        }
                    });
                }, errorHandler);
            }, Promise.resolve(decodedImages)).then(function(decodedImages){
                decodedImages.forEach(function(image, idx){
                    let dpr = Util.dpr();
                    //for U2020 , sprites (splitted images) are not available in some swing pages like splash or create NE, add a list validation
                    if(win.sprites && win.sprites.length != 0){
                        //the server sends bigger chunks of size 6 each of which is 6px, so index to start is 36
                        const IMAGE_START_INDEX = 36;
                        for(let i = IMAGE_START_INDEX * idx; i < IMAGE_START_INDEX * (idx+1) && i < win.sprites.length; i++ ){
                            let sprite = win.sprites[i];
                            context.save()
                            context.setTransform(dpr, 0, 0, dpr, 0, 0);
                            if (compositingWM) {
                            	context.drawImage(image.image, sprite.spriteX, sprite.spriteY, sprite.width, sprite.height, sprite.positionX, sprite.positionY, sprite.width, sprite.height);
                            } else {
                            	context.drawImage(image.image, sprite.spriteX, sprite.spriteY, sprite.width, sprite.height, win.posX + sprite.positionX, win.posY + sprite.positionY, sprite.width, sprite.height);
                            }
                            context.restore();
                        }
                    } else {
                        context.save()
                        context.setTransform(dpr, 0, 0, dpr, 0, 0);
                        if (compositingWM) {
                        	context.drawImage(image.image, image.winContent.positionX, image.winContent.positionY);
                        } else {
                        	context.drawImage(image.image, win.posX + image.winContent.positionX, win.posY + image.winContent.positionY);
                        }
                        context.restore();
                    }
                    image.image.onload = null;
                    image.image.src = '';
                    if (image.image.clearAttributes != null) {
                        image.image.clearAttributes();
                    }
                })
                //return canvas;
            });
        }
 
        function renderDirectDrawWindow(win, context) {
            return new Promise(function(resolved, rejected) {
                let ddPromise;
                var wih = windowImageHolders[win.id] != null ? windowImageHolders[win.id].element : null;
                
                if (typeof win.directDraw === 'string') {
                    ddPromise = directDraw.draw64(win.directDraw, wih);
                } else {
                    ddPromise = directDraw.drawBin(win.directDraw, wih);
                }
                
                ddPromise.then(function(canvas) {
                    windowImageHolders[win.id] = new CanvasWindow(win.id, canvas, win.name, win.title);
                    
                    let dpr = Util.dpr();
                    for ( let x in win.content) {
                        let winContent = win.content[x];
                        if (winContent != null) {
                           let sx = Math.min(canvas.width, Math.max(0, winContent.positionX * dpr));
                           let sy = Math.min(canvas.height, Math.max(0, winContent.positionY * dpr));
                           let sw = Math.min(canvas.width - sx, winContent.width * dpr - (sx - winContent.positionX * dpr));
                           let sh = Math.min(canvas.height - sy, winContent.height * dpr - (sy - winContent.positionY * dpr));

                           let dx = win.posX * dpr + sx;
                           let dy = win.posY * dpr + sy;
                            let dw = sw;
                            let dh = sh;

                            if (dx <= context.canvas.width && dy <= context.canvas.height && dx + dw > 0 && dy + dh > 0) {
                                context.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
                            }
                        }
                    }
                    resolved();
                }, function(error) {
                    rejected(error);
                });
            });
        }
        
        function renderDirectDrawComposedWindow(win, index) {
        	return new Promise(function (resolved, rejected) {
        		var ddPromise;
        		var wih = windowImageHolders[win.id] != null ? windowImageHolders[win.id].element : null;
        		
        		if (win.html) {
        			// we don't need to draw html window, also do not create canvas
        			ddPromise = Promise.resolve(null);
        		} else if (win.directDraw == null && wih == null) {
        			// ignore empty draw after first open
        			resolved();
        			return;
        		} else if (win.directDraw == null) {
        			ddPromise = Promise.resolve(wih);
        		} else if (typeof win.directDraw === 'string') {
        			ddPromise = directDraw.draw64(win.directDraw, wih);
        		} else {
        			ddPromise = directDraw.drawBin(win.directDraw, wih);
        		}
        		
        		ddPromise.then(function (canvas) {
        			var newWindowOpened = false;
        			
        			if (canvas != null) {
        				if (windowImageHolders[win.id] == null) {
        					windowImageHolders[win.id] = new CanvasWindow(win.id, canvas, win.name, win.title);
        					newWindowOpened = true;
        					$(canvas).attr('data-id', win.id).css("position", "absolute");

        					windowOpening(windowImageHolders[win.id]);
        					api.cfg.rootElement.append(canvas);
        				}
        			} else if (win.html) {
        				if (windowImageHolders[win.id] == null) {
        					var htmlDiv = document.createElement("div");
        					htmlDiv.classList.add("webswing-html-canvas");
        					
        					windowImageHolders[win.id] = new HtmlWindow(win.id, htmlDiv, win.name, win.title);
        					newWindowOpened = true;
        					$(htmlDiv).attr('data-id', win.id).css("position", "absolute");

        					windowOpening(windowImageHolders[win.id]);
        					api.cfg.rootElement.append(htmlDiv);
        				}
        			}
        			
        			if (newWindowOpened) {
        				windowOpened(windowImageHolders[win.id]);
        				performActionInternal({ actionName: "", eventType: "init", data: "", binaryData: null, windowId: win.id });
        			}
        			
        			var htmlOrCanvasElement = $(windowImageHolders[win.id].element);
        			htmlOrCanvasElement.css({"z-index": (compositionBaseZIndex + index + 1), "width": win.width + 'px', "height": win.height + 'px'});
        			if (htmlOrCanvasElement.is(".modal-blocked") != win.modalBlocked) {
        				htmlOrCanvasElement.toggleClass("modal-blocked", win.modalBlocked);
        				windowModalBlockedChanged(windowImageHolders[win.id]);
        			}
        			
        			if (isVisible(htmlOrCanvasElement[0].parentNode)) {
        				var p = api.translateDesktopPoint(win.posX, win.posY, htmlOrCanvasElement[0].parentNode);
        				htmlOrCanvasElement.css({"left": p.x + 'px', "top": p.y + 'px'});
        			}
        			
        			resolved();
        		}, function (error) {
        			rejected(error);
        		});
        	});
        }

        function isVisible(element) {
        	if (!element || element == null) {
        		return false;
        	}
        	
        	return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        }
 
        function adjustCanvasSize(canvas, width, height) {
        	let dpr = Util.dpr();
            if (canvas.width != width * dpr || canvas.height != height * dpr) {
                let ctx = canvas.getContext("2d");
                let snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.putImageData(snapshot, 0, 0);
                if (typeof(CollectGarbage) == "function") {
                    CollectGarbage();
                }
            }
        }
 
        function clear(x, y, w, h, context) {
            let dpr = Util.dpr();
            context.clearRect(x * dpr, y * dpr, w * dpr, h * dpr);
        }
 
        function copy(sx, sy, dx, dy, w, h, context) {
            let dpr = Util.dpr();
            let copy = context.getImageData(sx * dpr, sy * dpr, w * dpr, h * dpr);
            context.putImageData(copy, dx * dpr, dy * dpr);
            if (typeof(CollectGarbage) == "function") {
                CollectGarbage();
            }
        }

        function getCursorStyle(cursorMsg) {
            if (cursorMsg.b64img == null) {
                return cursorMsg.cursor;
            } else {
                let data = Util.getImageString(cursorMsg.b64img);
                return 'url(' + data + ') ' + cursorMsg.x + ' ' + cursorMsg.y + ' , auto';
            }
        }

        function getHandShake(canvas, continueOldSession) {
            let handshake = {
                applicationName : api.cfg.appName,
                clientId : api.cfg.clientId,
                viewId : api.cfg.viewId,
                sessionId : api.getSocketId(),
                locale : api.getLocale(),
                mirrored : api.cfg.mirrorMode,
                directDrawSupported : api.cfg.typedArraysSupported  && !(api.cfg.ieVersion && api.cfg.ieVersion <= 10),
                continueSession : continueOldSession || false
            };

            if (!api.cfg.mirrorMode) {
            	var desktopSize = api.getDesktopSize();
                handshake.applet = api.cfg.applet;
                handshake.documentBase = api.cfg.documentBase;
                handshake.params = api.cfg.params;
                handshake.desktopWidth = desktopSize.width;
                handshake.desktopHeight = desktopSize.height;
            }
            return {
                handshake : handshake
            };
        }

        function errorHandler(error) {
            drawingLock = null;
            throw error;
        }
        
        function CanvasWindow(id, element, name, title) {
        	this.id = id;
        	this.element = element;
        	this.name = name;
        	this.title = title;
        	this.htmlWindow = false;
        	this.webswingInstance = api.external;
        }
        
        CanvasWindow.prototype.isModalBlocked = function() {
        	return this.element.classList.contains('modal-blocked');
        };
        
        CanvasWindow.prototype.setBounds = function(x, y, width, height) {
        	api.send({window: {id: this.id, x: Math.floor(x), y: Math.floor(y), width: Math.floor(width), height: Math.floor(height)}});
    	};
    	
    	CanvasWindow.prototype.setBoundsInBrowser = function(x, y, width, height) {
    		var p = api.translateBrowserPoint(x, y);
    		api.send({window: {id: this.id, x: Math.floor(p.x), y: Math.floor(p.y), width: Math.floor(width), height: Math.floor(height)}});
    	};
    	
    	// move the Swing window to a location based on Desktop coordinates (defined by .webswing-element, [0, 0] is [webswing-element.offsetLeft, webswing-element.offsetTop])
    	CanvasWindow.prototype.moveOnDesktop = function(x, y) {
    		var rect = this.element.getBoundingClientRect();
    		api.send({window: {id: this.id, x: Math.floor(x), y: Math.floor(y), width: Math.floor(rect.width), height: Math.floor(rect.height)}});
    	};
    	
    	// move the Swing window to a location based on browser document coordinates ([0, 0] is document [0, 0]), this will be translated to Desktop coordinates
    	CanvasWindow.prototype.moveInBrowser = function(x, y) {
    		var rect = this.element.getBoundingClientRect();
    		var p = api.translateBrowserPoint(x, y);
    		
    		api.send({window: {id: this.id, x: Math.floor(p.x), y: Math.floor(p.y), width: Math.floor(rect.width), height: Math.floor(rect.height)}});
    	};
    	
    	CanvasWindow.prototype.setSize = function(width, height) {
    		var rect = this.element.getBoundingClientRect();
    		api.send({window: {id: this.id, x: Math.floor(rect.x + document.body.scrollLeft), y: Math.floor(rect.y + document.body.scrollTop), width: Math.floor(width), height: Math.floor(height)}});
    	};
    	
    	CanvasWindow.prototype.detach = function() {
    		if (!this.element.parentNode) {
    			console.error("Cannot detach window, it is not attached to any parent!");
    			return;
    		}
    		
    		return this.element.parentNode.removeChild(this.element);
    	};
    	
    	CanvasWindow.prototype.attach = function(parent, pos) {
    		if (this.element.parentNode) {
    			console.error("Cannot attach window, it is still attached to another parent!");
    			return;
    		}
    		
    		if (parent) {
    			parent.append(this.element);
    			var rect = this.element.getBoundingClientRect();
    			if (pos) {
    				this.moveInBrowser(pos.x, pos.y);
    			} else {
    				this.moveInBrowser(rect.left, rect.top);
    			}
    		}
    	};
    	
    	CanvasWindow.prototype.close = function() {
    		api.send({window: {id: this.id, close: true}});
    	};
    	
    	CanvasWindow.prototype.performAction = function(options) {
    		performAction($.extend({"windowId": this.id}, options));
    	}
    	
    	CanvasWindow.prototype.handleActionEvent = function(actionName, data, binaryData) {
        	// to be customized
        }
    	
    	CanvasWindow.prototype.windowClosing = function() {
    		// to be customized
    	}
    	
    	CanvasWindow.prototype.windowClosed = function() {
    		// to be customized
    	}
    	
    	function HtmlWindow(id, element, name, title) {
        	this.id = id;
        	this.element = element;
        	this.name = name;
        	this.title = title;
        	this.htmlWindow = true;
        	this.webswingInstance = api.external;
        }
    	
    	HtmlWindow.prototype.isModalBlocked = function() {
        	return this.element.classList.contains('modal-blocked');
        };
        
    	HtmlWindow.prototype.performAction = function(options) {
    		performAction($.extend({"windowId": this.id}, options));
    	}
    	
    	HtmlWindow.prototype.handleActionEvent = function(actionName, data, binaryData) {
        	// to be customized
        }
    	
    	HtmlWindow.prototype.windowClosing = function() {
    		// to be customized
    	}
    	
    	HtmlWindow.prototype.windowClosed = function() {
    		// to be customized
    	}
    	
        function getWindows() {
        	if (!compositingWM) {
        		// compositingWM only
        		return [];
        	}
        	
        	var wins = [];
        	for (var id in windowImageHolders) {
        		wins.push(windowImageHolders[id]);
        	}
        	
        	return wins;
        }
        
        function getWindowById(winId) {
        	if (!compositingWM) {
        		// compositingWM only
        		return;
        	}
        	
        	return windowImageHolders[winId];
        }
        
        
        function performAction(options) {
        	// options = {actionName, data, binaryData, windowId}
        	performActionInternal($.extend({"eventType": "user"}, options));
        }
        
        function performActionInternal(options) {
        	api.send({
                action: {
                	actionName: options.actionName,
                	eventType: options.eventType,
                	data: options.data || "",
                	binaryData: options.binaryData || null,
                	windowId: options.windowId || ""
                }
            });
        }
        
        function windowOpening(htmlOrCanvasWindow) {
        	try {
        		if (api.cfg.compositingWindowsListener && api.cfg.compositingWindowsListener.windowOpening) {
        			api.cfg.compositingWindowsListener.windowOpening(htmlOrCanvasWindow);
        		}
			} catch (e) {
				console.error(e);
			}
        }
        
        function windowOpened(htmlOrCanvasWindow) {
        	try {
        		if (api.cfg.compositingWindowsListener && api.cfg.compositingWindowsListener.windowOpened) {
        			api.cfg.compositingWindowsListener.windowOpened(htmlOrCanvasWindow);
        		}
			} catch (e) {
				console.error(e);
			}
        }
        
        function windowClosing(htmlOrCanvasWindow) {
        	try {
        		if (api.cfg.compositingWindowsListener && api.cfg.compositingWindowsListener.windowClosing) {
        			api.cfg.compositingWindowsListener.windowClosing(htmlOrCanvasWindow);
        		}
			} catch (e) {
				console.error(e);
			}
        }
        
        function windowClosed(htmlOrCanvasWindow) {
        	try {
        		if (api.cfg.compositingWindowsListener && api.cfg.compositingWindowsListener.windowClosed) {
        			api.cfg.compositingWindowsListener.windowClosed(htmlOrCanvasWindow);
        		}
			} catch (e) {
				console.error(e);
			}
        }
        
        function windowModalBlockedChanged(htmlOrCanvasWindow) {
        	try {
        		if (api.cfg.compositingWindowsListener && api.cfg.compositingWindowsListener.windowModalBlockedChanged) {
        			api.cfg.compositingWindowsListener.windowModalBlockedChanged(htmlOrCanvasWindow);
        		}
			} catch (e) {
				console.error(e);
			}
        }
        
        function handleActionEvent(actionName, data, binaryData) {
        	// to be customized
        }
        
    }
}
