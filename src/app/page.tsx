"use client";

import { useState } from "react";

const Home = function () {
  const [img, setImg] = useState<any>(null);
  const [err, setErr] = useState<string>("");
  const [imgURL, setImgURL] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const selectFile = function (e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    if (!e.target?.files?.[0]) {
      setErr("Please select a file.");
      return;
    }
    const selectedImg = e.target.files[0];

    if (!selectedImg.type.startsWith("image")) {
      setErr("File is not an image.");
      return;
    }

    setImg(selectedImg);
    const imageURL = URL.createObjectURL(selectedImg);
    setImgURL(imageURL);
  };

  const uploadImage = async function (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    if (!img) return;
    const body = new FormData();
    body.append("myImage", img);
    body.append("myDescription", description);

    const response = await fetch("/api/file", {
      method: "POST",
      body,
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <>
      <h1>Upload File</h1>
      <form
        className="form"
        onSubmit={uploadImage}
        encType="multipart/form-data"
      >
        <div className="input__group group--file">
          <label className="label--file" htmlFor="input--file">
            Select Image
          </label>
          <input
            id="input--file"
            name="myImage"
            type="file"
            onChange={selectFile}
          />
        </div>
        <div className="input__group group--description">
          <label className="label--description" htmlFor="input--description">
            Description:
          </label>
          <input
            id="input--description"
            name="myDescription"
            type="text"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="button--submit">
          Send
        </button>
      </form>
      {imgURL ? <img src={imgURL}></img> : ""}
      <p>{err}</p>
    </>
  );
};

export default Home;
