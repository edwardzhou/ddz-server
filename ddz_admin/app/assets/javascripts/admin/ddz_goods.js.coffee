# demo

removeAttrItem = (obj) ->
  parentObj = obj.parent()
  if parentObj.parent().children(".attrItem").length > 1
    parentObj.effect("drop", {}, 500, ()->
      parentObj.remove()
    )
  else
    parentObj.children("input").val("")


$(document).ready ->
  $("a[data-remove-item]").click ->
    removeAttrItem($(this))


  $("a[data-add-item]").click ->
    itemsId = $(this).data("items-id")
    items = $("#" + itemsId)
    newItem = items.children('.attrItem').last().clone()
    items.append(newItem)
    newItem.children('input').val("")
    newItem.effect('highlight', 500)
    $("a[data-remove-item]").click ->
      removeAttrItem($(this))

