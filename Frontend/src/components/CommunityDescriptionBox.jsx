export default function CommunityDescriptionBox({ selected, handleJoin, handleLeave }) {

  return (

    <div>

      <h2 className="text-2xl font-semibold">
        {selected.name}
      </h2>

      <p className="text-gray-600 mt-2">
        {selected.description}
      </p>

      <p className="mt-3 text-sm text-gray-500">
        Created by: {selected.createdBy?.name}
      </p>

      <div className="mt-4">

        <button
          onClick={() => handleJoin(selected._id)}
          className="bg-green-600 text-white px-4 py-2 mr-2 rounded"
        >
          Join
        </button>

        <button
          onClick={() => handleLeave(selected._id)}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Leave
        </button>

      </div>

    </div>

  )

}