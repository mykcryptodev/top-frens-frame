const unknownImage = "https://api-private.atlassian.com/users/6b5c1609134a5887d7f3ab1b73557664/avatar";

export const resizeImage = (url: string | undefined, size: number) => {
  if (!url) return unknownImage;
  let newUrl = url
    .replace("/original", `/anim=false,fit=contain,f=auto,w=${size}`)
    .replace(/w(_|\=)\d+/, `w$1${size}`);

  if (newUrl.includes("googleusercontent.com")) {
    newUrl = `${newUrl}=s${size}`;
  }

  if (newUrl.includes("w_256")) {
    newUrl = newUrl.replace("w_256", `w_${size}`);
  }
  return newUrl;
};

export default resizeImage;