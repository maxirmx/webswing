package org.webswing.directdraw.model;

import java.awt.image.*;
import java.io.*;
import java.util.*;

import javax.imageio.*;

import com.google.protobuf.*;
import org.webswing.directdraw.*;
import org.webswing.directdraw.proto.Directdraw.*;

public class ImageConst extends ImmutableDrawConstantHolder<byte[]>
{

    protected long hash;
    
	public ImageConst(DirectDraw context, BufferedImage value) {
		super(context, context.getServices().getPngImage(value));
        this.hash = context.getServices().computeHash(value);
	}

	@Override
	public String getFieldName() {
		return "image";
	}

    @Override
    public ImageProto toMessage() {
        ImageProto.Builder model = ImageProto.newBuilder();
        model.setData(ByteString.copyFrom(value));
        return model.build();
    }

    @Override
    public int hashCode() {
        return (int) hash;
    }

    @Override
    public boolean equals(Object o) {
        return o == this ||
            o instanceof ImageConst && Arrays.equals(value, ((ImageConst) o).value);
    }
    
    public static BufferedImage getValue(ImageProto proto) {
        try {
            return ImageIO.read(proto.getData().newInput());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}
