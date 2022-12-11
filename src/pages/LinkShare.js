export function LinkShare({ active }) {
  return (
    <div className={`linkShare ${active === true ? 'active' : ''}`}>
      <div className='link url'>
        <span className='link-text'>
          <svg xmlns='http://www.w3.org/2000/svg' height='48' width='48'>
            <path d='M22.5 34H14q-4.15 0-7.075-2.925T4 24q0-4.15 2.925-7.075T14 14h8.5v3H14q-2.9 0-4.95 2.05Q7 21.1 7 24q0 2.9 2.05 4.95Q11.1 31 14 31h8.5Zm-6.25-8.5v-3h15.5v3ZM25.5 34v-3H34q2.9 0 4.95-2.05Q41 26.9 41 24q0-2.9-2.05-4.95Q36.9 17 34 17h-8.5v-3H34q4.15 0 7.075 2.925T44 24q0 4.15-2.925 7.075T34 34Z'/>
          </svg>
        </span>
      </div>
      <div className='link qrcode'>
        <span className='link-text'>
          <svg xmlns='http://www.w3.org/2000/svg' height='48' width='48'>
            <path d='M6 22.5V6h16.5v16.5Zm3-3h10.5V9H9ZM6 42V25.5h16.5V42Zm3-3h10.5V28.5H9Zm16.5-16.5V6H42v16.5Zm3-3H39V9H28.5ZM37.9 42v-4.1H42V42ZM25.5 29.65V25.5h4.1v4.15Zm4.1 4.1v-4.1h4.15v4.1Zm-4.1 4.15v-4.15h4.1v4.15Zm4.1 4.1v-4.1h4.15V42Zm4.15-4.1v-4.15h4.15v4.15Zm0-8.25V25.5h4.15v4.15Zm4.15 4.1v-4.1H42v4.1Z'/>
          </svg>
        </span>
      </div>
    </div>
  );
}
