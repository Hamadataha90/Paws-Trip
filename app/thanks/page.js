'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ThanksPage = () => {
  const [statusMessage, setStatusMessage] = useState('')
  const [txnId, setTxnId] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const txn_id = searchParams.get('txn_id')
    const status = searchParams.get('status')

    if (txn_id && status) {
      setTxnId(txn_id)

      if (status === 'completed') {
        setStatusMessage('Your payment was successfully processed. Thank you for your purchase!')
      } else if (status === 'cancelled') {
        setStatusMessage('Your payment was not completed. Please try again or contact support.')
      } else {
        setStatusMessage('There was an issue with your payment. Please contact support.')
      }
    }
  }, [searchParams])

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Thank You!</h1>
      {txnId ? (
        <>
          <p>Transaction ID: <strong>{txnId}</strong></p>
          <p>{statusMessage}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

const ThanksPageWithSuspense = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ThanksPage />
    </Suspense>
  )
}

export default ThanksPageWithSuspense
