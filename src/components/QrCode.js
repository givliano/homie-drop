export const QRCode = ({ url }) => {
  // const el = window.kjua({text: url });
  // console.log(el);
  // document.querySelector('body').appendChild(el);

  return (
    <div>
      {kjua({ text: url })}
    </div>
  );
}
