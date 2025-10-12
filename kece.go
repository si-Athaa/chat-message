package main
import "fmt"

func main() {
    nama := "Atha"
    fmt.Println(greet(nama))
}

func greet(nama string) string {
    return "Hai " + nama
}
