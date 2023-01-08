import React, { useRef, useState } from "react";
import ImgCrop from "./ImgCrop";
import { Upload } from "antd";

const getSrcFromFile = (file: any) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => resolve(reader.result);
  });
};

const Avatar = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(false);
  const [file, setFile] = useState<string | ArrayBuffer>("");

  const open = () => {
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const onPreview = async (file: any) => {
    console.log({ file });
    const src = file.url || (await getSrcFromFile(file));
    const imgWindow = window.open(src);

    if (imgWindow) {
      const image = new Image();
      image.src = src;
      imgWindow.document.write(image.outerHTML);
    } else {
      window.location.href = src;
    }
  };

  const onChange = () => {
    if (fileRef.current === null) {
      return;
    }
    if (imgRef.current === null) {
      return;
    }
    const reads = new FileReader();
    const f = fileRef.current?.files?.[0];
    console.log({ f });
    reads.readAsDataURL(f);
    reads.onload = function (e) {
      fileRef.current.value = "";
      open();
      imgRef.current.src = this.result;
      this.result && setFile(this.result);
    };
  };

  return (
    <>
      <input ref={fileRef} onChange={onChange} type="file" accept="image/*" />
      <img src="" ref={imgRef} width={"200"} />
      <ImgCrop file={file} open={visible} onClose={close} shape="round" />
    </>
  );
};

export default Avatar;
