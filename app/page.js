'use client'
import Image from "next/image";
import {useState} from 'react';
import {Box,Stack,TextField,Button, Avatar, Typography, Modal} from '@mui/material'

export default function Home() {

  const [messages,setMessages] = useState([
    {
      role:"assistant",
      content:"Hello, I am the Rate My Professor support assistant. You can feel free to ask me anything related to which professors to choose. How can I help you today?"
    }
  ])
  const [message, setMessage]=useState('')
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''}
    ])

    const response = fetch('/api/chat/', {
      method: "POST",
      headers: {
        'ContentType': 'application/json'
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}])
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length-1]
          let cleanedText = lastMessage.content.replace("#","").replace("*","")
          let otherMessages = messages.slice(0,messages.length-1)
          return [
            ...otherMessages,
            {...lastMessage, content: cleanedText + text},
          ]
        })

        return reader.read().then(processText)
      })
    })

    setMessage('')
  }
  return (
    <Box
          width='100vw'
          height='100vh'
          display='flex'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          gap={2}
          bgcolor='#FBD7B1'
          >
            <Typography
                variant='h5'
                fontWeight='600'
                color='#F27059'>
                🎓  Rate My Professor  🎓
            </Typography>

            <Stack
              direction='column'
              width='50vw'
              height='80vh'
              style={{
                boxShadow: '0px 4px 8px rgba(44, 48, 49, 0.5)', // Add box shadow here
                borderRadius: '36px' // Optional: border radius for rounded corners
              }}
              p={3}
              spacing={3}
              bgcolor='white'>
                <Stack
                  direction='column'
                  spacing={2}
                  flexGrow={1}
                  overflow='auto'
                  maxHeight='100%'>
                    {
                      messages.map((message,index) => (
                        <Box
                            display='flex'
                            flexDirection={
                                message.role === 'assistant' ? 'row' : 'row-reverse' }
                            alignItems='flex-end'
                            gap={2}
                            key={index}>
                        <Avatar 
                            alt='chelsea she' 
                            src={
                                message.role === 'assistant' ? 'images/ratemyprof.jpg' : 'images/student.jpg' }
                            sx={{ width: 60, height: 60 }}/>
                        <Box
                          justifyContent={
                            message.role === 'assistant' ? 'flex-start' : 'flex-end' }
                          maxWidth='75%'
                          >
                            <Box
                            bgcolor= { 
                              message.role === 'assistant' ? '#F25C54' : '#F69979'}
                            color='white'
                            sx={{fontFamily: 'Inter, sans-serif', fontWeight: '500'}}
                            style={ 
                                message.role === 'assistant' ? {
                                borderTopLeftRadius: '30px', // Top-left corner
                                borderTopRightRadius: '30px', // Top-right corner
                                borderBottomLeftRadius: '0px', // Bottom-left corner
                                borderBottomRightRadius: '20px',
                                whiteSpace: 'pre-line',
                              } : {
                                borderTopLeftRadius: '30px', // Top-left corner
                                borderTopRightRadius: '30px', // Top-right corner
                                borderBottomLeftRadius: '30px', // Bottom-left corner
                                borderBottomRightRadius: '0px',
                                whiteSpace: 'pre-line', 
                              }
                            }
                            p={3}
                            key={message.content}>
                              {message.content}
                            </Box>
                        </Box>
                        </Box>
                      ))
                    }
                </Stack>
    
                <Stack
                  direction='row'
                  spacing={2}>
                    <TextField
                      label='message'
                      fullWidth
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      sx={{
                        fontFamily: 'Inter, sans-serif', 
                        '& .MuiInputBase-root': {
                          color: '#F48D7B',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#F48D7B', // Label color
                          fontFamily: 'Inter, sans-serif', 
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#F48D7B',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderRadius:'12px', // Border color
                          },
                          '&:hover fieldset': {
                            borderColor: '#F48D7B', // Border color on hover
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#F48D7B', // Border color when focused
                          },
                        },
                      }}
                      />
                    <Button
                      variant='contained'
                      onClick={sendMessage}
                      sx={{bgcolor:'#F48D7B', 
                        '&:hover': {
                        bgcolor: '#F14A41'    /* Darker border on hover */
                    }}}>
                      send
                    </Button>
    
                </Stack>
            </Stack>
            
          </Box>
  )
}
