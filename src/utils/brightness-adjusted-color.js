import brightness from './brightness'

export default color => brightness(color) > 150 ? '#000' : '#fff'
