    export type Category = {
        id: number;
        name: string;
        image: any;
    };

    export const categories: Category[] = [
        {
            id: 1, 
            name: "Beef",
            image: require("../../assets/images/beef1.png")
        },
        {
            id: 2,
            name: "Pork",
            image: require("../../assets/images/pork1.png"),
        },
        {
            id: 3,
            name: "Chicken",
            image: require("../../assets/images/chicken.png"),
        },
        {
            id: 4,
            name: "Fish",
            image: require("../../assets/images/fish.png"),
        },
        {
            id: 5,
            name: "Pasta",
            image: require("../../assets/images/pasta.png")
        },
        {
            id: 6,
            name: "Veggies",
            image: require("../../assets/images/veggies.png"),
        },
        {
            id: 7,
            name: "Plain Rice",
            image: require("../../assets/images/rice.png"),
        },
        {
            id: 8,
            name: "Drinks",
            image: require("../../assets/images/drinks.png"),
        },
        {
            id: 9,
            name: "Dessert",
            image: require("../../assets/images/dessert.jpg"),
        },
    ];