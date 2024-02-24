'use client'

import { FC, useEffect, useState } from 'react'

import { ContractIds } from '@/deployments/deployments'
import { zodResolver } from '@hookform/resolvers/zod'
import GreeterContract from '@inkathon/contracts/typed-contracts/contracts/greeter'
import {
  useInkathon,
  useRegisteredContract,
  useRegisteredTypedContract,
} from '@scio-labs/use-inkathon'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { contractTxWithToast } from '@/utils/contract-tx-with-toast'

const formSchema = z.object({
  newMessage: z.string().min(1).max(90),
})

export const GreeterContractInteractions: FC = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.Greeter)
  const { typedContract } = useRegisteredTypedContract(ContractIds.Greeter, GreeterContract)
  const [greeterMessage, setGreeterMessage] = useState<string>()
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [index, setIndex] = useState(0)
  const [sec, setSec] = useState(0)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const { register, reset, handleSubmit } = form

  // Fetch Greeting
  const fetchGreeting = async () => {
    if (!contract || !typedContract || !api) return

    setFetchIsLoading(true)

    try {
      // Alternatively: Fetch it with typed contract instance
      if (sec !== undefined) {
        console.log('value of sec: ', sec)
        const val = await (await typedContract.query.index(sec)).value.ok
        if (val !== undefined) {
          setIndex(val)
        } else {
          setIndex(0)
        }
        console.log('value of index: ', index)
      }

      const typedResult = await typedContract.query.greet(index)
      /*if (index !== undefined) {
        const typedResult = (await typedContract.query.greet()).value
      }*/
      setGreeterMessage(typedResult.value.ok)
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching greeting. Try again…')
      setGreeterMessage(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      const dateObject = new Date()
      const seconds = dateObject.getSeconds()
      if (seconds % 5 === 0 || seconds % 1 === 0 || seconds % 3 === 0) {
        setSec(seconds + sec)
      }
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    fetchGreeting()
  }, [sec])

  // Update Greeting
  const updateGreeting: SubmitHandler<z.infer<typeof formSchema>> = async ({ newMessage }) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'setMessage', {}, [
        newMessage,
      ])
      reset()
    } catch (e) {
      console.error(e)
    } finally {
      fetchGreeting()
    }
  }

  if (!api) return null

  return (
    <>
      <div className="flex max-w-[22rem] grow flex-col gap-4">
        <h2 className="text-center font-mono text-gray-400">Greeter Smart Contract</h2>

        <Form {...form}>
          {/* Fetched Greeting */}
          <Card>
            <CardContent className="pt-6">
              <FormItem>
                <FormLabel className="text-base">Fetched Greeting</FormLabel>
                <FormControl>
                  <Input
                    placeholder={fetchIsLoading || !contract ? 'Loading…' : greeterMessage}
                    disabled={true}
                  />
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>

          {/* Update Greeting */}
          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={handleSubmit(updateGreeting)}
                className="flex flex-col justify-end gap-2"
              >
                <FormItem>
                  <FormLabel className="text-base">Update Greeting</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input disabled={form.formState.isSubmitting} {...register('newMessage')} />
                      <Button
                        type="submit"
                        className="bg-primary font-bold"
                        disabled={fetchIsLoading || form.formState.isSubmitting}
                        isLoading={form.formState.isSubmitting}
                      >
                        Submit
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              </form>
            </CardContent>
          </Card>
        </Form>

        {/* Contract Address */}
        <p className="text-center font-mono text-xs text-gray-600">
          {contract ? contractAddress : 'Loading…'}
        </p>
      </div>
    </>
  )
}
