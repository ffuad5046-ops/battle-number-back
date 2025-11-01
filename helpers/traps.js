export const fastLeaveX = async (userId, game) => {
    if (game.player1Id === userId) {
        game.speedOfDrawPlayer1 = 100
    } else {
        game.speedOfDrawPlayer2 = 100
    }

    await game.save()
}

export const slowLeaveX = async (userId, game) => {
    if (game.player1Id === userId) {
        game.speedOfDrawPlayer2 = 360
    } else {
        game.speedOfDrawPlayer1 = 360
    }

    await game.save()
}