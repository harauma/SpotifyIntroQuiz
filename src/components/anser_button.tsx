import { FC } from 'react'
import useSound from 'use-sound'
import styles from '@styles/components/anser_button.module.scss'

type Props = {
  disabled: boolean
  setDisabled: (disabled: boolean) => void
  onClickButton: () => void
}

export const AnserButton: FC<Props> = (props) => {
  const { disabled, setDisabled, onClickButton } = props
  const [play] = useSound('/mp3/anser.mp3')
  return (
    <div
      className={styles['buzzer-quiz-button']}
      onClick={() => {
        if (!disabled) {
          setDisabled(true)
          play()
          onClickButton()
        }
      }}
    >
      <div className={styles['button-top'] + ' ' + styles['button-top1']}></div>
      <div className={styles['button-top'] + ' ' + styles['button-top2']}></div>
      <div className={styles['button-top'] + ' ' + styles['button-top3']}></div>
      <div
        className={styles['button-bottom'] + ' ' + styles['button-bottom1']}
      ></div>
      <div
        className={styles['button-bottom'] + ' ' + styles['button-bottom1']}
      ></div>
      <div
        className={styles['button-bottom'] + ' ' + styles['button-bottom1']}
      ></div>
    </div>
  )
}
