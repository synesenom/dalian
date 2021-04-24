export default function Vector (x, y) {
    // Public API.
    return {
        x () {
            return x
        },

        y () {
            return y
        },

        dx (value) {
            return Vector(x + value, y)
        },

        dy (value) {
            return Vector(x,y + value)
        },

        length () {
            return Math.sqrt(x * x + y * y)
        },

        norm () {
            let length = length()
            return Vector(x / length, y / length)
        },

        rot (angle) {
            let rad = Math.PI * angle / 180
            const c = Math.cos(rad)
            const s = Math.sin(rad)
            return Vector(x * c - y * s, x * s + y * c)
        },

        add (vector) {
            return Vector(x + vector.x(), y + vector.y())
        },

        sub (vector) {
            return Vector(x - vector.x(), y - vector.y())
        },

        mult (value) {
            return Vector(value * x, value * y)
        },

        dot (vector) {
            return x * vector.x() + y * vector.y()
        },

        path() {
            return `${x} ${y}`
        }
    }
}
