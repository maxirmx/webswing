package sk.viktor.containers;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Point;
import java.awt.image.BufferedImage;

import javax.swing.JFrame;

import sk.viktor.ignored.common.GraphicsWrapper;
import sk.viktor.ignored.common.PaintManager;
import sk.viktor.ignored.common.WebWindow;
import sk.viktor.ignored.model.s2c.JsonWindowInfo;
import sk.viktor.util.Util;

public class WebJFrame extends JFrame implements WebWindow {

    /**
      * 
      */
    private static final long serialVersionUID = -2131755526938257553L;
    private BufferedImage virtualScreen;
    private BufferedImage diffScreen;

    public WebJFrame(String title) {
        super(title);
    }

    @Override
    public Graphics getGraphics() {
        if (virtualScreen == null || virtualScreen.getWidth() != this.getWidth() || virtualScreen.getHeight() != this.getHeight()) {
            virtualScreen = new BufferedImage(this.getWidth(), this.getHeight(), BufferedImage.TYPE_INT_ARGB_PRE);
            diffScreen = new BufferedImage(this.getWidth(), this.getHeight(), BufferedImage.TYPE_INT_ARGB_PRE);
        }
        return new GraphicsWrapper((Graphics2D) super.getGraphics(), this);
    }

    public BufferedImage getVirtualScreen() {
        if (this.getRootPane() != null) {
            return virtualScreen.getSubimage(this.getRootPane().getX(), this.getRootPane().getY(), this.getRootPane().getWidth(), this.getRootPane().getHeight());
        }
        return virtualScreen;
    }

    public byte[] getDiffWebData() {
        synchronized (this) {
            byte[] res;
            if (this.getRootPane() != null) {
                res = Util.getPngImage(diffScreen.getSubimage(this.getRootPane().getX(), this.getRootPane().getY(), this.getRootPane().getWidth(), this.getRootPane().getHeight()));
            } else {
                res = Util.getPngImage(diffScreen);
            }
            resetScreen(diffScreen);
            return res;
        }
    }

    public void resetScreen(BufferedImage img) {
        Graphics2D g = (Graphics2D) img.getGraphics();
        g.setBackground(new Color(0, 0, 0, 0));
        g.clearRect(0, 0, img.getWidth(), img.getHeight());
        g.dispose();
    }

    public void addChangesToDiff() {
        synchronized (this) {
            Graphics g = diffScreen.getGraphics();
            g.drawImage(virtualScreen, 0, 0, null);
            g.dispose();
            resetScreen(virtualScreen);
        }
    }

    public Graphics2D getWebGraphics() {
        return (Graphics2D) virtualScreen.getGraphics();
    }

    public void setVirtualScreen(BufferedImage virtualScreen) {
        this.virtualScreen = virtualScreen;
    }

    public JsonWindowInfo getWindowInfo() {
        JsonWindowInfo result = new JsonWindowInfo();
        result.setHeight(this.getVirtualScreen().getHeight());
        result.setWidth(this.getVirtualScreen().getWidth());
        result.setHasFocus(this.isFocused());
        result.setTitle(this.getTitle());
        result.setId(Util.getObjectIdentity(this));
        return result;
    }

    public Point getFrameTranslation() {
        return new Point(this.getRootPane().getX(), this.getRootPane().getY());
    }

    public String getClientId() {
        return Util.resolveClientId(this.getClass());
    }

    @SuppressWarnings("deprecation")
    @Override
    public void show() {
        PaintManager.getInstance(getClientId()).registerWindow(this);
        super.show();
    }

    @Override
    public void setVisible(boolean b) {
        PaintManager.getInstance(getClientId()).registerWindow(this);
        if(!b){
            PaintManager.getInstance(getClientId()).hideWindowInBrowser(this);    
        }
        super.setVisible(b);
    }

    @Override
    public void dispose() {
        PaintManager.getInstance(getClientId()).disposeWindow(this);
        super.dispose();
    }

    //    @Override
    //    public void setDefaultCloseOperation(int operation) {
    //        super.setDefaultCloseOperation(operation==EXIT_ON_CLOSE?DISPOSE_ON_CLOSE:operation);
    //    }

}
