import type { PropsWithChildren, RefObject } from 'react'

type DialogProps = {
  ref?: RefObject<HTMLDialogElement|null>
  isOpen: boolean
  close: () => void
  title: string
}

/** Base dialog that has a title, close button, and a scrollable body. */
export function Dialog({ ref, isOpen, close, title, children }: PropsWithChildren<DialogProps>) {
  return (
    <dialog ref={ref} className='modal' style={{ display: isOpen ? 'block' : 'none', backgroundColor: 'rgb(64 64 64 / 25%)', border: 'none' }}>
      <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable'>
        <div className='modal-content'>
          <header className='modal-header' style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className='modal-title'>{title}</h1>
            <button onClick={close} className='btn-close'>
              <span className='visually-hidden'>Close</span>
            </button>
          </header>
          {children}
        </div>
      </div>
    </dialog>
  )
}
