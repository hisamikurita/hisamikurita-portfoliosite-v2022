/**
 * ブラウザ標準のドラッグ&ドロップを無効にする
 * 画像やリンク、選択したテキストを押したまま動かすとブラウザのドラッグが始まり、
 * その間はcursor: noneが効かずにOSのデフォルトカーソルが出てしまうため
 * (カードのドラッグはGSAPのDraggableで、標準のドラッグは使っていない)
 */
document.addEventListener('dragstart', (e) => {
  e.preventDefault()
})
